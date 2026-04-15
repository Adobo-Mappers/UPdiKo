/**
 * This module handles the AI-powered chatbot for the UPdiKo location discovery app.
 * It integrates with Google Gemini API to provide conversational location search
 * and navigation assistance for the UPV Miagao campus area.
 * 
 * Architecture:
 * - Express router handles /api/cassie endpoints
 * - Gemini API with function calling for location searches
 * - In-memory session management with auto-cleanup
 * - Tool-based calls to search local SQLite database
 * 
 * @module server/gemini
 * @requires express
 * @requires crypto
 * @requires @google/genai
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Configuration constants
// API_BASE: Backend URL for location queries (configurable via environment)
// SESSION_MAX_HISTORY: Maximum number of conversation turns to preserve per session
// SESSION_CLEANUP_INTERVAL_MS: How often to remove abandoned sessions (15 minutes)
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const SESSION_MAX_HISTORY = 20;
const SESSION_CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

let GoogleGenAI;

/**
 * Gets or creates the Google GenAI singleton instance
 * Uses lazy loading pattern to defer module import until needed
 * 
 * @param {string} apiKey - Google Gemini API key
 * @returns {Promise<Object>} GenAI client instance
 * @async
 */
async function getGenAIInstance(apiKey) {
  if (!GoogleGenAI) {
    const mod = await import('@google/genai');
    GoogleGenAI = mod.GoogleGenAI;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * System Prompt for Casie AI Assistant
 * 
 * This prompt defines Casie's persona, behavior, and boundaries.
 * It instructs the AI to:
 * - Act as a local guide for UPV Miagao campus
 * - Use conversational, brief responses (2-3 sentences max)
 * - Use local Filipino terms naturally
 * - Never invent information or use emojis
 * - Use the search_locations tool for location queries
 * - Only mention exact location names from search results
 * - Strictly decline out-of-scope requests (code, math, essays, etc.)
 * 
 * @constant {string}
 * @see https://ai.google.dev/docs/gemini-api-guide
 */
const CASIE_SYSTEM_PROMPT = `You are Casie, a digital navigator and trusted local guide for the UPdiKo location discovery app — built for students, faculty, staff, and visitors finding their way around the University of the Philippines Visayas (UPV) campus and the town of Miagao, Iloilo.

## Who you are
You combine the warmth of a kuya or ate who's been around campus for years with the practical helpfulness of a well-staffed information desk. You know that navigating a new place can feel overwhelming, and your job is to make it feel manageable, even welcoming.

## How you speak
- Keep all conversational responses brief: 2-3 sentences maximum.
- Conversational and warm, but never vague. Every response should leave the person knowing exactly what to do next.
- Use local terms naturally when appropriate (e.g., "habal-habal," "palengke," "sari-sari") — but never at the expense of clarity.
- No emojis. Use plain language that reads well on mobile.
- Adapt your tone: quick logistical queries get short answers; orientation queries get a reassuring, step-by-step approach.

## Navigation & Data Rules
- Lead with landmarks, not compass directions. (e.g., "From the Admin Building, walk toward the Oblation...")
- Never invent details, coordinates, or addresses you're unsure of. 
- Use real coordinates for the Miagao area (approximately lat: 10.64, lng: 122.07).

## Tool Usage & Boundaries (CRITICAL)
- You have access to a "search_locations" tool. Use it whenever the user asks about finding places, getting directions, or any location-related queries.
- If a user greets you or says thanks, respond warmly and naturally without using the tool.
- STRICT BOUNDARY: You are ONLY a local guide for Miagao. If a user asks you to write code, solve math, write essays, or answer general trivia, you MUST decline. Respond exactly with: "I'm just here to help you navigate around UPV and Miagao! I can't help with that, but let me know if you need to find a place nearby."

## When Showing Locations (VERY IMPORTANT)
- ONLY mention the EXACT location names returned by the search tool - do NOT add or substitute any other names.
- If the search returns "Restaurant A", "Restaurant B", "Restaurant C", you must ONLY mention those exact names.
- Never say "like Restaurant A or other places" - only use the exact names from the results.
- The location cards on the screen will show the exact places found, so your text must match those exactly.`;

/**
 * Session Storage
 * 
 * Stores conversation history for each user session.
 * - sessions: Map<sessionId, conversation[]>
 * - sessionTimestamps: Map<sessionId, lastActiveTimestamp>
 * 
 * Used for:
 * - Maintaining conversation context across messages
 * - Tracking last active time for cleanup
 * - Session continuity during navigation
 */
const sessions = new Map();
const sessionTimestamps = new Map();

/**
 * Periodic Session Cleanup
 * 
 * Runs every 15 minutes to remove abandoned sessions
 * and prevent memory leaks. Sessions without activity
 * for 15 minutes are automatically deleted.
 * 
 * @interval
 */
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, lastActive] of sessionTimestamps) {
    if (now - lastActive > SESSION_CLEANUP_INTERVAL_MS) {
      sessions.delete(sessionId);
      sessionTimestamps.delete(sessionId);
    }
  }
}, SESSION_CLEANUP_INTERVAL_MS);

/**
 * Tool Definition: search_locations
 * 
 * Defines the function schema for location searches.
 * Gemini uses this to understand when and how to call
 * the backend location database.
 * 
 * Parameters:
 * - category: Type of place (restaurant, pharmacy, etc.)
 * - keyword: Specific name to search for
 * 
 * @constant {Object}
 */
const searchLocationsTool = {
  name: "search_locations",
  description: "Searches the local database for places, businesses, or landmarks in Miagao. Use when user asks about finding places, getting directions, or any location-related queries.",
  parameters: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "The type of place to search for (e.g., 'restaurant', 'pharmacy', 'clinic', 'market', 'church', 'bank', 'school', 'convenience'). Can also be left empty if using keyword."
      },
      keyword: {
        type: "string",
        description: "A specific name or search term (e.g., 'Jollibee', 'Mercury Drug', 'Palengke'). Optional if category is provided."
      }
    }
  }
};

/**
 * Query Location Database
 * 
 * Called by Gemini when the AI needs to search for places.
 * This is the bridge between the AI and local SQLite database.
 * 
 * Process:
 * 1. Fetch all locations from API
 * 2. Filter by category (e.g., "restaurant")
 * 3. Filter by keyword (e.g., "Jollibee")
 * 4. Calculate distance if user location provided (Haversine formula)
 * 5. Return up to 10 matching locations with coordinates
 * 
 * @param {string|null} category - Place type to search for
 * @param {string|null} keyword - Specific name to search for
 * @param {number|null} userLat - User's current latitude
 * @param {number|null} userLng - User's current longitude
 * @returns {Promise<Array>} Array of location objects
 * @async
 */
async function queryLocations(category, keyword, userLat, userLng) {
  try {
    const response = await fetch(`${API_BASE}/locations`);
    if (!response.ok) {
      console.error('Failed to fetch locations:', response.statusText);
      return [];
    }
    
    let locations = await response.json();
    
    if (category) {
      const catLower = category.toLowerCase();
      locations = locations.filter(loc => {
        const type = (loc.location_type || '').toLowerCase();
        const tags = Array.isArray(loc.tags) ? loc.tags : JSON.parse(loc.tags || '[]');
        const tagsLower = tags.map(t => t.toLowerCase());
        return type.includes(catLower) || tagsLower.some(t => t.includes(catLower));
      });
    }
    
    if (keyword) {
      const kwLower = keyword.toLowerCase();
      locations = locations.filter(loc => {
        const name = (loc.name || '').toLowerCase();
        const address = (loc.address || '').toLowerCase();
        return name.includes(kwLower) || address.includes(kwLower);
      });
    }
    
    if (userLat && userLng) {
      const R = 6371; 
      locations = locations
        .filter(loc => loc.latitude && loc.longitude)
        .map(loc => {
          const dLat = (loc.latitude - userLat) * Math.PI / 180;
          const dLng = (loc.longitude - userLng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(userLat * Math.PI / 180) * Math.cos(loc.latitude * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return { ...loc, distance: R * c };
        })
        // TODO: Fix this - Math.random() sort is not truly random and has undefined behavior
        // Use Fisher-Yates shuffle instead for proper randomization
        .sort(() => Math.random() - 0.5);
    }
    
    return locations.slice(0, 10).map(loc => ({
      name: loc.name,
      address: loc.address || 'Miagao, Iloilo',
      lat: loc.latitude,
      lng: loc.longitude,
      type: loc.location_type || '',
      distance: loc.distance ? `${loc.distance.toFixed(1)} km` : null
    }));
    
  } catch (error) {
    console.error('Error querying locations:', error);
    return [];
  }
}

router.post('/', async (req, res) => {
  const { message, context, sessionId } = req.body;
  const apiKey = req.headers['x-gemini-key'];

  if (!message) return res.status(400).json({ error: 'Message is required' });
  if (!apiKey) return res.status(400).json({ error: 'Gemini API key not provided' });

  const currentSessionId = sessionId || crypto.randomUUID();
  
  if (!sessions.has(currentSessionId)) {
    sessions.set(currentSessionId, []);
    sessionTimestamps.set(currentSessionId, Date.now());
  } else {
    sessionTimestamps.set(currentSessionId, Date.now());
  }
  
  const userHistory = sessions.get(currentSessionId);
  
  try {
    const genAI = await getGenAIInstance(apiKey);

    let dynamicContext = "";
    if (context) {
      if (context.currentPage) dynamicContext += `\nThe user is currently on the: ${context.currentPage} page.`;
      if (context.selectedLocation) dynamicContext += `\nThe user has selected: ${context.selectedLocation.name}.`;
      if (context.userPreferences) dynamicContext += `\nUser preferences: ${context.userPreferences}`;
      if (context.userLocation) {
        dynamicContext += `\nUser's current location: lat ${context.userLocation.lat.toFixed(4)}, lng ${context.userLocation.lng.toFixed(4)}`;
      }
    }

    const fullSystemInstruction = dynamicContext 
      ? `${CASIE_SYSTEM_PROMPT}\n\n[CURRENT UI CONTEXT]${dynamicContext}` 
      : CASIE_SYSTEM_PROMPT;

    // 1. Append the user's new message to the history array
    userHistory.push({ role: 'user', parts: [{ text: message }] });

    // Ensure history doesn't grow infinitely (keep last 20 messages to preserve context)
    if (userHistory.length > SESSION_MAX_HISTORY) {
      userHistory.splice(0, userHistory.length - 20);
    }

    // 2. Initial call to Gemini, providing the tools and full history
    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: userHistory,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.4,
        tools: [{ functionDeclarations: [searchLocationsTool] }]
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const functionCallParts = parts.filter(p => p.functionCall);
    
    let finalText = "";
    let locations = [];
    
    // 3. Handle the Tool Call (if Gemini decided it needs database data)
    if (functionCallParts.length > 0) {
      const funcCall = functionCallParts[0].functionCall;
      
      // Required by Gemini function calling protocol - push model's request to history
      userHistory.push({
        role: 'model',
        parts: parts 
      });

      const category = funcCall.args?.category || null;
      const keyword = funcCall.args?.keyword || null;
      const userLat = context?.userLocation?.lat || null;
      const userLng = context?.userLocation?.lng || null;
      
      // Execute local backend query
      const dbResults = await queryLocations(category, keyword, userLat, userLng);
      
      // Push tool results back to Gemini - part of function calling protocol
      userHistory.push({ 
        role: 'user', 
        parts: [{ 
          functionResponse: {
            name: funcCall.name,
            response: { output: dbResults }
          }
        }] 
      });
      
      // Provide an extra prompt instruction for handling empty database results
      const searchTerm = category || keyword || 'that';
      const locationNames = dbResults.map(l => l.name).join(', ');
      const synthesisInstruction = dbResults.length === 0 
        ? `IMPORTANT: The database returned no results. Respond conversationally telling the user you couldn't find any ${searchTerm} in Miagao.`
        : fullSystemInstruction + `\n\nIMPORTANT: The search returned these exact locations: ${locationNames}. Your response MUST mention ONLY these exact names - do not add or substitute any other place names.`;

      // 4. Second call to Gemini to synthesize the data into a natural response
      const synthesisResponse = await genAI.models.generateContent({
        model: GEMINI_MODEL,
        contents: userHistory,
        config: {
          systemInstruction: synthesisInstruction,
          temperature: 0.4
        }
      });

      finalText = synthesisResponse.text;
      locations = dbResults.slice(0, 3).map(loc => ({
        name: loc.name,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng
      }));
      
      // Append the final synthesized text to the history
      userHistory.push({ role: 'model', parts: [{ text: finalText }] });

    } else {
      // 5. Handle General Chat (No tool called)
      finalText = response.text || "I'm not sure how to respond to that.";
      userHistory.push({ role: 'model', parts: [{ text: finalText }] });
    }

    res.json({ 
        message: finalText,
        places: locations,
        sessionId: currentSessionId 
    });
    
  } catch (error) {
    console.error('Casie routing error:', error);
    
    let userMessage = "Something went wrong. Please try again.";
    const errorStr = error.message?.toLowerCase() || '';
    
    // Safety net: If the conversation array gets corrupted, clear it out.
    if (errorStr.includes('function response turn') || errorStr.includes('role')) {
      sessions.set(currentSessionId, []);
      userMessage = "I lost my train of thought! Could you repeat that?";
    } else if (errorStr.includes('429') || errorStr.includes('rate limit')) {
      userMessage = "You've sent too many messages. Please wait a moment and try again.";
    } else if (errorStr.includes('timeout') || errorStr.includes('504')) {
      userMessage = "The helper is taking too long to respond. Please try your request again.";
    } else if (errorStr.includes('network') || errorStr.includes('fetch')) {
      userMessage = "Unable to connect. Please check your internet connection and try again.";
    }
    
    res.status(500).json({ error: userMessage, sessionId: currentSessionId });
  }
});

router.post('/clear', (req, res) => {
  try {
    const { sessionId } = req.body;
    if (sessionId && sessions.has(sessionId)) {
        sessions.delete(sessionId);
        res.json({ success: true, message: 'Conversation cleared for session' });
    } else {
        res.status(400).json({ error: 'Valid sessionId required to clear history' });
    }
  } catch (error) {
    console.error('Clear history error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to clear history' });
  }
});

router.get('/history', (req, res) => {
  try {
    const { sessionId } = req.query;
    if (sessionId && sessions.has(sessionId)) {
        res.json({ history: sessions.get(sessionId) });
    } else {
        res.json({ history: [] });
    }
  } catch (error) {
    console.error('Get history error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to get history' });
  }
});

module.exports = router;