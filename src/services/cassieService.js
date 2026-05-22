import { fetchJson } from './api.js';

/**
 * Sends a message to the secure Express Casie endpoint.
 *
 * @param {{ message: string, context?: Record<string, any>, sessionId?: string | null, history?: Array<Record<string, any>> }} payload
 * @returns {Promise<{ message: string, places: Array<Record<string, any>>, sessionId: string, history: Array<Record<string, any>> }>}
 */
export function sendToCasie(payload) {
  return fetchJson('/api/cassie', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: payload.message,
      context: payload.context,
      sessionId: payload.sessionId,
      history: payload.history || [],
    }),
  });
}

/**
 * Clears a server-side Casie chat session.
 *
 * @param {string | null} sessionId
 * @returns {Promise<{ success: boolean }>}
 */
export function clearCasieHistory(sessionId) {
  return fetchJson('/api/cassie/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
}
