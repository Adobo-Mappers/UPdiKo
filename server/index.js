import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const parseCsv = (value = '') =>
  String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const geminiApiKeys = [
  ...parseCsv(process.env.GEMINI_API_KEYS),
  ...parseCsv(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY),
];

const geminiModels = parseCsv(
  process.env.GEMINI_MODELS ||
    'gemini-2.5-flash,gemini-2.0-flash,gemini-2.0-flash-lite,gemini-1.5-flash'
);
const modelCatalogCache = new Map();
const MODEL_CATALOG_TTL_MS = 10 * 60 * 1000;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const casieSessions = new Map();

const CASIE_SYSTEM_PROMPT = `
You are Casie, UPdiKo's local guide for UP Visayas Miagao and nearby Miagao services.
Follow this priority order:
1) Scope
- Only help with UPV and Miagao places, navigation, local discovery, and personal-pin guidance.
- If outside scope, say you can only help with UPV and Miagao places.

2) Directions
- If user asks for directions, route guidance, navigation, or how to get somewhere, call search_locations first with the best category/keyword guess.
- If matches exist, return the best place name(s) and guide the user to navigate there.
- If no matches exist, ask a short clarifying question (for example, which dorm name).
- Do not refuse with "I can't show you the way" for valid local navigation requests.

3) Personal Pins
- If user asks how to create a personal pin, give concise step-by-step instructions (maximum 5 steps).
- Mention login is required.
- Use this flow: open Map, tap map to drop a pin, fill New Pin fields (name/address/tags/description, optional image), then tap Save Pin.

4) Nearby Recommendations
- If user asks for nearby places or local recommendations, call search_locations with broad relevant keywords.
- Recommend only relevant places in Miagao / UPV context.

5) Tone
- Keep responses concise, clear, warm, and upbeat (friendly local buddy).
- Use light positive wording (for example, "Sure thing!").
- Avoid baby talk, emoji spam, or overexcited long messages.
- Accuracy comes before style for directions and instructions.
`;

const searchLocationsTool = {
  functionDeclarations: [
    {
      name: 'search_locations',
      description: 'Searches public UPdiKo locations for category or keyword matches.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
          },
          keyword: {
            type: 'string',
          },
        },
      },
    },
  ],
};

app.use(
  cors({
    origin: [/localhost:\d+$/],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

const casieLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many Casie requests. Please wait a bit before trying again.',
  },
});

/**
 * @param {string} [sessionId]
 * @returns {string}
 */
function ensureSessionId(sessionId) {
  if (sessionId) {
    return sessionId;
  }

  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `casie-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

/**
 * @param {Record<string, any>} context
 * @returns {string}
 */
function getDynamicContext(context = {}) {
  let dynamicContext = '';

  if (context.currentPage) {
    dynamicContext += `\nCurrent page: ${context.currentPage}.`;
  }

  if (context.selectedLocation?.name) {
    dynamicContext += `\nCurrently selected location: ${context.selectedLocation.name}.`;
  }

  if (context.userLocation?.lat && context.userLocation?.lng) {
    dynamicContext += `\nUser coordinates: ${Number(context.userLocation.lat).toFixed(4)}, ${Number(
      context.userLocation.lng
    ).toFixed(4)}.`;
  }

  return dynamicContext;
}

/**
 * @param {Array<Record<string, any>>} locations
 * @param {{ category?: string | null, keyword?: string | null }} filters
 * @returns {Array<Record<string, any>>}
 */
function queryLocations(locations, filters = {}) {
  const category = String(filters.category || '')
    .toLowerCase()
    .trim();
  const keyword = String(filters.keyword || '')
    .toLowerCase()
    .trim();

  return locations
    .filter((location) => {
      const name = String(location.name || '').toLowerCase();
      const tags = Array.isArray(location.tags)
        ? location.tags.map((tag) => String(tag).toLowerCase())
        : [];

      const categoryMatches = !category || tags.some((tag) => tag.includes(category));
      const keywordMatches =
        !keyword || name.includes(keyword) || tags.some((tag) => tag.includes(keyword));

      return categoryMatches && keywordMatches;
    })
    .slice(0, 8)
    .map((location) => ({
      id: location.id,
      name: location.name,
      address: location.address || 'Miagao, Iloilo',
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      tags: Array.isArray(location.tags) ? location.tags : [],
    }));
}

async function loadPublicLocations() {
  const { data, error } = await supabase
    .from('openstreets_static_locations')
    .select('id, name, address, latitude, longitude, tags');

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * @param {string} apiKey
 * @returns {Promise<string[]>}
 */
async function fetchGenerateModelsForKey(apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || `ListModels failed (${response.status})`);
  }

  const available = (payload.models || [])
    .filter((model) => Array.isArray(model.supportedGenerationMethods))
    .filter((model) => model.supportedGenerationMethods.includes('generateContent'))
    .map((model) => String(model.name || '').replace(/^models\//, ''))
    .filter(Boolean);

  if (available.length === 0) {
    throw new Error('No generateContent-compatible Gemini models were returned for this API key.');
  }

  const preferredSet = new Set(geminiModels);
  const preferred = geminiModels.filter((model) => available.includes(model));
  const discoveredFlash = available.filter(
    (model) => !preferredSet.has(model) && /flash/i.test(model)
  );
  const discoveredOther = available.filter(
    (model) => !preferredSet.has(model) && !/flash/i.test(model)
  );

  return [...preferred, ...discoveredFlash, ...discoveredOther];
}

/**
 * @param {string} apiKey
 * @returns {Promise<string[]>}
 */
async function getModelsForKey(apiKey) {
  const now = Date.now();
  const cached = modelCatalogCache.get(apiKey);
  if (cached && now - cached.fetchedAt < MODEL_CATALOG_TTL_MS && cached.models.length > 0) {
    return cached.models;
  }

  const models = await fetchGenerateModelsForKey(apiKey);
  modelCatalogCache.set(apiKey, { models, fetchedAt: now });
  return models;
}

/**
 * @param {object} body
 * @returns {Promise<any>}
 */
async function callGemini(body) {
  if (geminiApiKeys.length === 0) {
    throw new Error('Missing GEMINI_API_KEY or GEMINI_API_KEYS on the server.');
  }

  let lastError;

  for (const apiKey of geminiApiKeys) {
    let modelsToTry = geminiModels;

    try {
      modelsToTry = await getModelsForKey(apiKey);
    } catch (catalogError) {
      console.warn(`Gemini model catalog lookup failed. Falling back to configured model list. ${catalogError.message}`);
    }

    for (const model of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      try {
        const response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message || `Gemini request failed (${response.status})`);
        }

        console.log(`Gemini responded using model: ${model}`);
        return payload;
      } catch (error) {
        console.warn(`Gemini key+model failed (${model}): ${error.message}`);
        lastError = error;
      }
    }
  }

  throw new Error(`All Gemini keys/models failed. Last error: ${lastError?.message}`);
}

function extractText(responsePayload) {
  const parts = responsePayload?.candidates?.[0]?.content?.parts || [];

  return parts
    .filter((part) => typeof part.text === 'string')
    .map((part) => part.text)
    .join('')
    .trim();
}

function getFunctionCall(responsePayload) {
  const parts = responsePayload?.candidates?.[0]?.content?.parts || [];
  return parts.find((part) => part.functionCall)?.functionCall || null;
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.post('/api/cassie', casieLimiter, async (request, response) => {
  const message = String(request.body?.message || '').trim();
  const sessionId = ensureSessionId(request.body?.sessionId);
  const context = request.body?.context || {};

  if (!message) {
    response.status(400).json({ error: 'A message is required.' });
    return;
  }

  const sessionHistory = casieSessions.get(sessionId) || [];
  const fullSystemInstruction = `${CASIE_SYSTEM_PROMPT}${getDynamicContext(context)}`;

  sessionHistory.push({ role: 'user', parts: [{ text: message }] });

  try {
    const firstResponse = await callGemini({
      contents: sessionHistory,
      systemInstruction: { parts: [{ text: fullSystemInstruction }] },
      generationConfig: { temperature: 0.4 },
      tools: [searchLocationsTool],
    });

    const functionCall = getFunctionCall(firstResponse);
    let replyText = extractText(firstResponse);
    let places = [];

    if (functionCall?.name === 'search_locations') {
      sessionHistory.push({
        role: 'model',
        parts: firstResponse?.candidates?.[0]?.content?.parts || [],
      });

      const allLocations = await loadPublicLocations();
      places = queryLocations(allLocations, functionCall.args || {});

      sessionHistory.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: functionCall.name,
              response: {
                output: places,
              },
            },
          },
        ],
      });

      const secondResponse = await callGemini({
        contents: sessionHistory,
        systemInstruction: {
          parts: [
            {
              text: `${fullSystemInstruction}\nOnly mention exact place names from the provided function response.`,
            },
          ],
        },
        generationConfig: { temperature: 0.4 },
      });

      replyText =
        extractText(secondResponse) ||
        (places.length > 0
          ? `I found ${places[0].name}.`
          : "I couldn't find a matching place in Miagao right now.");
      sessionHistory.push({ role: 'model', parts: [{ text: replyText }] });
    } else {
      replyText = replyText || "I'm not sure how to respond to that.";
      sessionHistory.push({ role: 'model', parts: [{ text: replyText }] });
    }

    casieSessions.set(sessionId, sessionHistory.slice(-20));
    response.json({ message: replyText, places, sessionId });
  } catch (error) {
    response.status(500).json({
      error: error.message || 'Failed to process the Casie request.',
    });
  }
});

app.post('/api/cassie/clear', (request, response) => {
  const sessionId = request.body?.sessionId;

  if (sessionId) {
    casieSessions.delete(sessionId);
  }

  response.json({ success: true });
});

app.post('/api/directions', async (request, response) => {
  const { startLat, startLng, endLat, endLng } = request.body || {};

  if (
    !Number.isFinite(Number(startLat)) ||
    !Number.isFinite(Number(startLng)) ||
    !Number.isFinite(Number(endLat)) ||
    !Number.isFinite(Number(endLng))
  ) {
    response.status(400).json({ error: 'Valid start and end coordinates are required.' });
    return;
  }

  const { data, error } = await supabase.rpc('get_pedestrian_route', {
    start_lat: Number(startLat),
    start_lng: Number(startLng),
    end_lat: Number(endLat),
    end_lng: Number(endLng),
  });

  if (error) {
    response.status(503).json({
      error:
        'Pedestrian routing is not ready yet. Load the campus path graph in Supabase, then retry.',
      detail: error.message,
    });
    return;
  }

  response.json({
    coordinates: data?.coordinates || [],
    distanceMeters: data?.distance_meters || null,
    durationMinutes: data?.duration_minutes || null,
  });
});

app.listen(port, () => {
  console.log(`UPdiKo backend listening on http://localhost:${port}`);
});
