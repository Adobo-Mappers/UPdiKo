import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

const port = Number(process.env.PORT || 3000);
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiRequestTimeoutMs = Number(process.env.GEMINI_REQUEST_TIMEOUT_MS || 7000);
// const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
// const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
const geminiModels = (process.env.GEMINI_MODELS || 'gemini-2.5-flash-lite,gemini-2.5-flash,gemini-2.0-flash-lite,gemini-2.0-flash')
  .split(',')
  .map(m => m.trim())
  .filter(Boolean);
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    if (!supabaseUrl) throw new Error('Missing SUPABASE_URL env var');
    if (!supabaseKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY env var');
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

const CASIE_SYSTEM_PROMPT =`
  
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
  - Accuracy comes before style for directions and instructions.`
  ;
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

const allowedOrigins = [
  /localhost:\d+$/,
];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

const casieLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyGenerator: (request) => ipKeyGenerator(request.ip),
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
  const category = String(filters.category || '').toLowerCase().trim();
  const keyword = String(filters.keyword || '').toLowerCase().trim();

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
  const { data, error } = await getSupabase()
    .from('openstreets_static_locations')
    .select('id, name, address, latitude, longitude, tags');

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * @param {object} body
 * @returns {Promise<any>}
 */
async function callGemini(body) {
  if (!geminiApiKey) {
    throw new Error('Missing GEMINI_API_KEY on the server.');
  }

  let lastError;

  for (const model of geminiModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), geminiRequestTimeoutMs);

    try {
      const response = await fetch(`${endpoint}?key=${encodeURIComponent(geminiApiKey)}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || `Gemini request failed (${response.status})`);
      }

      console.log(`Gemini responded using model: ${model}`);
      return payload;
    } catch (error) {
      const message =
        error.name === 'AbortError'
          ? `Gemini request timed out after ${geminiRequestTimeoutMs}ms`
          : error.message;

      console.warn(`Gemini model "${model}" failed: ${message}`);
      lastError = new Error(message);

      if (error.name === 'AbortError') {
        break;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
}

/**
 * @param {Error} error
 * @returns {number}
 */
function getCasieErrorStatus(error) {
  const message = String(error?.message || '').toLowerCase();

  if (message.includes('timed out')) {
    return 504;
  }

  if (
    message.includes('missing gemini_api_key') ||
    message.includes('missing supabase') ||
    message.includes('gemini request failed') ||
    message.includes('all gemini models failed')
  ) {
    return 503;
  }

  return 500;
}

/**
 * @param {Error} error
 * @returns {string}
 */
function getCasieErrorMessage(error) {
  const message = String(error?.message || '').toLowerCase();

  if (message.includes('timed out')) {
    return 'Casie took too long to respond. Please try a shorter question.';
  }

  if (message.includes('missing')) {
    return 'Casie is not fully configured on the server yet.';
  }

  return 'Casie is temporarily unavailable. Please try again in a bit.';
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

  // Client-driven history: receives previous turns from the client so
  // conversation context survives across serverless cold starts.
  const sessionHistory = Array.isArray(request.body?.history)
    ? request.body.history
    : [];
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

    response.json({
      message: replyText,
      places,
      sessionId,
      history: sessionHistory.slice(-20),
    });
  } catch (error) {
    console.error('Casie request failed:', error);
    response.status(getCasieErrorStatus(error)).json({
      error: getCasieErrorMessage(error),
    });
  }
});

app.post('/api/cassie/clear', (_request, response) => {
  // History is client-driven; client clears its own historyRef.
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

  const { data, error } = await getSupabase().rpc('get_pedestrian_route', {
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

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`UPdiKo backend listening on http://localhost:${port}`);
  });
}

export default app;
