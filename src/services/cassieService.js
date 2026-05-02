/**
 * Frontend-only Casie AI service.
 *
 * Architecture:
 * - Direct Gemini REST calls from browser
 * - Local function-calling for location search via locations service
 * - Local session/history persistence in localStorage
 */

import { getStaticLocations, queryLocations } from './locations.js';
import { supabase } from './supabase.js';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3-flash-preview';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const SESSION_MAX_HISTORY = 20;
const STORAGE_KEY = 'updi_casie_sessions_v1';
const ACTIVE_SESSION_KEY = 'updi_casie_active_session_v1';

const CASIE_SYSTEM_PROMPT = `You are Casie, a digital navigator and trusted local guide for the UPdiKo location discovery app — built for students, faculty, staff, and visitors finding their way around the University of the Philippines Visayas (UPV) campus and the town of Miagao, Iloilo.

## Who you are
You combine the warmth of a kuya or ate who's been around campus for years with the practical helpfulness of a well-staffed information desk.

## How you speak
- Keep all conversational responses brief: 2-3 sentences maximum.
- Conversational and warm, but never vague.
- Use local terms naturally when appropriate.
- No emojis.

## Tool Usage & Boundaries (CRITICAL)
- You have access to a "search_locations" tool. Use it for finding places and location-related queries.
- If a user greets you or says thanks, reply naturally without using the tool.
- STRICT BOUNDARY: You are ONLY a local guide for Miagao. If the user asks for code, math, essays, or general trivia, respond exactly with: "I'm just here to help you navigate around UPV and Miagao! I can't help with that, but let me know if you need to find a place nearby."

## When Showing Locations (VERY IMPORTANT)
- ONLY mention exact location names returned by the tool.
- Never add, substitute, or invent location names.`;

const searchLocationsTool = {
  functionDeclarations: [
    {
      name: 'search_locations',
      description:
        'Searches local UPdiKo locations in Miagao. Use for finding places, directions, and location-related queries.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Type of place (e.g., restaurant, pharmacy, clinic, market, church, bank, school).',
          },
          keyword: {
            type: 'string',
            description: 'Specific name or search term (e.g., Mercury Drug, palengke).',
          },
        },
      },
    },
  ],
};

const safeParseJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `casie-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

const loadSessions = () => {
  if (typeof localStorage === 'undefined') return {};
  return safeParseJson(localStorage.getItem(STORAGE_KEY) || '{}', {});
};

const saveSessions = (sessions) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

let currentSessionId =
  (typeof localStorage !== 'undefined' && localStorage.getItem(ACTIVE_SESSION_KEY)) || null;

const setActiveSession = (sessionId) => {
  currentSessionId = sessionId;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
  }
};

const getDynamicContext = (context = {}) => {
  let dynamicContext = '';
  if (context.currentPage) dynamicContext += `\nThe user is currently on the: ${context.currentPage} page.`;
  if (context.selectedLocation?.name) {
    dynamicContext += `\nThe user has selected: ${context.selectedLocation.name}.`;
  }
  if (context.userPreferences) {
    dynamicContext += `\nUser preferences: ${context.userPreferences}`;
  }
  if (context.userLocation?.lat && context.userLocation?.lng) {
    dynamicContext += `\nUser's current location: lat ${Number(context.userLocation.lat).toFixed(4)}, lng ${Number(context.userLocation.lng).toFixed(4)}`;
  }
  return dynamicContext;
};

const extractText = (responseData) => {
  const parts = responseData?.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((part) => typeof part.text === 'string')
    .map((part) => part.text)
    .join('')
    .trim();
};

const getFunctionCallPart = (responseData) => {
  const parts = responseData?.candidates?.[0]?.content?.parts || [];
  return parts.find((part) => part.functionCall) || null;
};

const mapUserFacingError = (error) => {
  const errorStr = String(error?.message || '').toLowerCase();
  if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('rate')) {
    return "You've sent too many messages. Please wait a moment and try again.";
  }
  if (errorStr.includes('network') || errorStr.includes('fetch')) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }
  if (errorStr.includes('api key') || errorStr.includes('invalid key') || errorStr.includes('permission')) {
    return 'AI is not configured correctly. Please verify your Gemini API key.';
  }
  if (errorStr.includes('cors')) {
    return 'AI request was blocked by browser policy. Check Gemini key restrictions and allowed origins.';
  }
  return 'Something went wrong. Please try again.';
};

const callGemini = async ({ contents, systemInstruction, tools = null, temperature = 0.4 }) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing VITE_GEMINI_API_KEY');
  }

  const body = {
    contents,
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { temperature },
  };

  if (tools) {
    body.tools = [tools];
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message || `Gemini request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
};

const runLocationSearch = async ({ category = null, keyword = null, context = {} }) => {
  const locations = await getStaticLocations(supabase);
  const userLat = context?.userLocation?.lat ?? null;
  const userLng = context?.userLocation?.lng ?? null;

  const matches = queryLocations(locations, {
    category,
    keyword,
    userLat,
    userLng,
    limit: 10,
  });

  return matches.map((loc) => ({
    name: loc.name,
    address: loc.address || 'Miagao, Iloilo',
    lat: loc.latitude,
    lng: loc.longitude,
    type: loc.location_type || '',
    distance: typeof loc.distance === 'number' ? `${loc.distance.toFixed(1)} km` : null,
  }));
};

export async function sendToCasie(message, context = {}) {
  const sessionId = currentSessionId || createSessionId();
  setActiveSession(sessionId);

  const sessions = loadSessions();
  const userHistory = Array.isArray(sessions[sessionId]) ? sessions[sessionId] : [];

  try {
    const dynamicContext = getDynamicContext(context);
    const fullSystemInstruction = dynamicContext
      ? `${CASIE_SYSTEM_PROMPT}\n\n[CURRENT UI CONTEXT]${dynamicContext}`
      : CASIE_SYSTEM_PROMPT;

    userHistory.push({ role: 'user', parts: [{ text: message }] });
    if (userHistory.length > SESSION_MAX_HISTORY) {
      userHistory.splice(0, userHistory.length - SESSION_MAX_HISTORY);
    }

    const firstResponse = await callGemini({
      contents: userHistory,
      systemInstruction: fullSystemInstruction,
      tools: searchLocationsTool,
      temperature: 0.4,
    });

    const firstParts = firstResponse?.candidates?.[0]?.content?.parts || [];
    const functionCallPart = getFunctionCallPart(firstResponse);

    let finalText = '';
    let places = [];

    if (functionCallPart?.functionCall) {
      userHistory.push({ role: 'model', parts: firstParts });

      const args = functionCallPart.functionCall.args || {};
      const category = args.category || null;
      const keyword = args.keyword || null;
      const dbResults = await runLocationSearch({ category, keyword, context });

      userHistory.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: functionCallPart.functionCall.name,
              response: { output: dbResults },
            },
          },
        ],
      });

      const searchTerm = category || keyword || 'that';
      const locationNames = dbResults.map((loc) => loc.name).join(', ');
      const synthesisInstruction =
        dbResults.length === 0
          ? `IMPORTANT: The location search returned no results. Respond conversationally and tell the user you couldn't find any ${searchTerm} in Miagao.`
          : `${fullSystemInstruction}\n\nIMPORTANT: The search returned these exact locations: ${locationNames}. Mention only these exact names.`;

      const synthesisResponse = await callGemini({
        contents: userHistory,
        systemInstruction: synthesisInstruction,
        temperature: 0.4,
      });

      finalText = extractText(synthesisResponse) || "I'm not sure how to respond to that.";
      places = dbResults.slice(0, 3).map((loc) => ({
        name: loc.name,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
        latitude: loc.lat,
        longitude: loc.lng,
      }));

      userHistory.push({ role: 'model', parts: [{ text: finalText }] });
    } else {
      finalText = extractText(firstResponse) || "I'm not sure how to respond to that.";
      userHistory.push({ role: 'model', parts: [{ text: finalText }] });
    }

    if (userHistory.length > SESSION_MAX_HISTORY) {
      userHistory.splice(0, userHistory.length - SESSION_MAX_HISTORY);
    }

    sessions[sessionId] = userHistory;
    saveSessions(sessions);

    return {
      message: finalText,
      places,
      sessionId,
    };
  } catch (error) {
    sessions[sessionId] = [];
    saveSessions(sessions);
    throw new Error(mapUserFacingError(error));
  }
}

export async function clearCasieHistory() {
  if (!currentSessionId) {
    return { success: true, message: 'No active session to clear' };
  }

  const sessions = loadSessions();
  delete sessions[currentSessionId];
  saveSessions(sessions);

  return { success: true, message: 'Conversation cleared for session' };
}

export async function getCasieHistory() {
  if (!currentSessionId) return { history: [] };
  const sessions = loadSessions();
  return { history: Array.isArray(sessions[currentSessionId]) ? sessions[currentSessionId] : [] };
}

export function resetSession() {
  currentSessionId = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}