import { useCallback, useRef, useState } from 'react';
import { clearCasieHistory, sendToCasie } from '../services/cassieService.js';

const GREETING = "Hi! I'm Casie, your friendly guide to Miagao. How can I help you explore today?";
const RATE_LIMIT_MS = 2000;
const DAILY_MESSAGE_LIMIT = 50;

const sanitizeInput = (text) => {
  if (!text) {
    return '';
  }

  let sanitized = text.trim();

  if (sanitized.length > 500) {
    sanitized = sanitized.slice(0, 500);
  }

  const injectionPatterns = [
    /ignore\s+(previous|all|prior)/i,
    /forget\s+(everything|all|previous)/i,
    /disregard\s+(instructions|system)/i,
    /system\s*:/i,
    /you\s+are\s+(now|a)/i,
    /act\s+as\s+if/i,
    /pretend\s+(to|you)/i,
  ];

  injectionPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  });

  return sanitized;
};

const normalizePlaces = (places = []) =>
  places.map((place) => ({
    ...place,
    latitude: Number(place.latitude ?? place.lat),
    longitude: Number(place.longitude ?? place.lng),
  }));

/**
 * Shared Casie hook used by the floating widget and the full-page assistant.
 *
 * @param {Record<string, any>} context
 * @returns {{
 *   messages: Array<Record<string, any>>,
 *   input: string,
 *   isLoading: boolean,
 *   setInput: (value: string) => void,
 *   sendMessage: (override?: string) => Promise<void>,
 *   clearSession: () => Promise<void>
 * }}
 */
export function useCasie(context) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef(null);
  const historyRef = useRef([]);
  const lastMessageTimeRef = useRef(0);
  const dailyCountRef = useRef({ date: new Date().toDateString(), count: 0 });

  const appendAssistantMessage = useCallback((content, locations = []) => {
    setMessages((previous) => [
      ...previous,
      {
        role: 'assistant',
        content,
        locations: locations.length > 0 ? normalizePlaces(locations) : undefined,
      },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (override = '') => {
      const rawMessage = typeof override === 'string' && override ? override : input;
      const userMessage = sanitizeInput(rawMessage);

      if (!userMessage || isLoading) {
        return;
      }

      const now = Date.now();
      const today = new Date().toDateString();

      if (dailyCountRef.current.date !== today) {
        dailyCountRef.current = { date: today, count: 0 };
      }

      if (now - lastMessageTimeRef.current < RATE_LIMIT_MS) {
        appendAssistantMessage('Please wait a moment before sending another message.');
        return;
      }

      if (dailyCountRef.current.count >= DAILY_MESSAGE_LIMIT) {
        appendAssistantMessage("You've reached the daily message limit. Please try again tomorrow.");
        return;
      }

      lastMessageTimeRef.current = now;
      dailyCountRef.current.count += 1;
      setInput('');
      setMessages((previous) => [...previous, { role: 'user', content: userMessage }]);
      setIsLoading(true);

      try {
        const payload = await sendToCasie({
          message: userMessage,
          context,
          sessionId: sessionIdRef.current,
          history: historyRef.current,
        });

        sessionIdRef.current = payload.sessionId;
        if (Array.isArray(payload.history)) {
          historyRef.current = payload.history;
        }
        appendAssistantMessage(payload.message, payload.places || []);
      } catch (error) {
        appendAssistantMessage(
          error.message || "Sorry, I'm having trouble connecting to my servers right now."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [appendAssistantMessage, context, input, isLoading]
  );

  const clearSession = useCallback(async () => {
    if (sessionIdRef.current) {
      await clearCasieHistory(sessionIdRef.current).catch(() => null);
    }

    sessionIdRef.current = null;
    historyRef.current = [];
    setInput('');
    setMessages([{ role: 'assistant', content: GREETING }]);
  }, []);

  return {
    messages,
    input,
    isLoading,
    setInput,
    sendMessage,
    clearSession,
  };
}
