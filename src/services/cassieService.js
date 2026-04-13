const API_BASE = 'http://localhost:3000/api';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Store session ID globally for the widget
let currentSessionId = null;

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
  
  // Update global session ID BEFORE returning
  if (data.sessionId) {
    currentSessionId = data.sessionId;
  }
  
  return data;
}

// Clear conversation history
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

// Get conversation history
export async function getCasieHistory() {
  const response = await fetch(`${API_BASE}/cassie/history?sessionId=${currentSessionId}`);
  return response.json();
}

// Reset session (for testing)
export function resetSession() {
  currentSessionId = null;
}