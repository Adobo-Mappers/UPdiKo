const express = require('express');
const router = express.Router();
const crypto = require('crypto');

console.log('Loading Casie routes...');

let GoogleGenAI;
async function getGenAIInstance(apiKey) {
  if (!GoogleGenAI) {
    const mod = await import('@google/genai');
    GoogleGenAI = mod.GoogleGenAI;
  }
  return new GoogleGenAI({ apiKey });
}

// Updated System Prompt to handle out-of-scope queries strictly
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
- You have access to a "search_locations" tool. Use it whenever the user asks about finding places, getting directions, or local services.
- If a user greets you or says thanks, respond warmly and naturally without using the tool.
- STRICT BOUNDARY: You are ONLY a local guide for Miagao. If a user asks you to write code, solve math, write essays, or answer general trivia, you MUST decline. Respond exactly with: "I'm just here to help you navigate around UPV and Miagao! I can't help with that, but let me know if you need to find a place nearby."`;

const sessions = new Map();

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

async function queryLocations(category, keyword, userLat, userLng) {
  const API_BASE = 'http://localhost:3000/api';
  
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
        .sort((a, b) => a.distance - b.distance);
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
    if (userHistory.length > 20) {
      userHistory.splice(0, userHistory.length - 20);
    }

    // 2. Initial call to Gemini, providing the tools and full history
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
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
      
      // CRITICAL FIX: You must push the EXACT parts array returned by the model, 
      // which includes the required 'thought_signature' and the 'functionCall'.
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
      
      // CRITICAL FIX: You MUST push the backend's response back to the history array as a user turn
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
      const synthesisInstruction = dbResults.length === 0 
        ? `IMPORTANT: The database returned no results. Respond conversationally telling the user you couldn't find any ${searchTerm} in Miagao.`
        : fullSystemInstruction;

      // 4. Second call to Gemini to synthesize the data into a natural response
      const synthesisResponse = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
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