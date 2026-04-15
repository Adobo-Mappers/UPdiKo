/**
 * Handles communication between the frontend and Casie AI backend.
 * Manages session ID persistence for conversation continuity.
 * 
 * Architecture:
 * - REST API calls to /api/cassie endpoints
 * - Session ID stored globally for continuity
 * - Error handling with user-friendly messages
 * 
 * @module services/cassieService
 * ============================================================================
 */

const API_BASE = 'http://localhost:3000/api';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Current session ID for conversation continuity
 * Persisted across component renders
 * Updated after each API response
 * @type {string|null}
 */
let currentSessionId = null;

/**
 * Send a message to Casie AI and get response
 * 
 * Process:
 * 1. Send message + context + sessionId to backend
 * 2. Backend processes with Gemini AI
 * 3. Returns response + locations + new sessionId
 * 4. Update sessionId for next message
 * 
 * @param {string} message - User's input message
 * @param {Object} context - Current app state (page, location, etc.)
 * @returns {Promise<Object>} { message, places, sessionId }
 * @async
 * @throws {Error} If API returns error
 */
export async function sendToCasie(message, context = {}) {
  const response = await fetch(`${API_BASE}/cassie`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Gemini-Key': GEMINI_API_KEY
    },
    body: JSON.stringify({ message, context, sessionId: currentSessionId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get response from Casie');
  }

  const data = await response.json();
  
  // Update global session ID for conversation continuity
  if (data.sessionId) {
    currentSessionId = data.sessionId;
  }
  
  return data;
}

/**
 * Clear conversation history on backend
 * Called when user clicks "clear chat" button
 * 
 * @returns {Promise<Object>} { success, message }
 * @async
 */
export async function clearCasieHistory() {
  const response = await fetch(`${API_BASE}/cassie/clear`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Gemini-Key': GEMINI_API_KEY
    },
    body: JSON.stringify({ sessionId: currentSessionId }),
  });
  return response.json();
}

/**
 * Get conversation history from backend
 * 
 * @returns {Promise<Object>} { history: Array }
 * @async
 */
export async function getCasieHistory() {
  const response = await fetch(`${API_BASE}/cassie/history?sessionId=${currentSessionId}`);
  return response.json();
}

/**
 * Reset session ID locally
 * Called after clearing history to start fresh
 * 
 * @returns {void}
 */
export function resetSession() {
  currentSessionId = null;
}