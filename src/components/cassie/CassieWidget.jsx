/**
 * A floating button that opens an inline chat with the Casie AI assistant.
 * Used throughout the app for quick location queries and navigation help.
 * 
 * Features:
 * - Floating toggle button (bottom-right corner)
 * - Quick prompt buttons for common queries
 * - Location cards display for search results
 * - Auto-scroll to latest message
 * - Session persistence via API
 * 
 * Props:
 * - currentSection: Current app section (HOME, MAP, etc.)
 * - selectedService: Currently selected location (if any)
 * - userLocation: User's GPS coordinates for distance calculation
 * - onNavigateToLocation: Callback when user selects a location
 * 
 * @component
 * @requires casieService for API calls
 * @requires locations.js for local database fallback
 * ============================================================================
 */

import { useState, useRef, useEffect } from 'react';
import { sendToCasie, clearCasieHistory, resetSession } from '../../services/cassieService';
import { getStaticLocations, matchLocation } from '../../services/locations.js';
import { supabase } from '../../services/supabase.js';
import LocationCards from '../../components/casie/LocationCards';
import chatIcon from '../../assets/images/icon/chatIcon.svg';
import closeIcon from '../../assets/images/icon/x.svg';
import nextIcon from '../../assets/images/icon/next-icon.png';
import clearIcon from '../../assets/images/icon/broom.svg';
import './CassieWidget.css';

/**
 * Initial greeting message shown when widget opens
 * @constant {string}
 */
const GREETING = "Hi! I'm Casie, your friendly guide to Miagao. How can I help you explore today?";

/**
 * Maximum number of location cards to display
 * @constant {number}
 */
const MAX_CARDS = 3;

// Rate limiting configuration
const RATE_LIMIT_MS = 2000;          // 2 seconds between messages (anti-spam)
const DAILY_MESSAGE_LIMIT = 50;       // Max messages per day per user
const MAX_CONCURRENT_REQUESTS = 1;           // Prevent parallel requests

// Track rate limiting per session (in-memory)
let lastMessageTime = 0;
let messageCountToday = 0;
let messageCountDate = new Date().toDateString();

// TODO: Extract logic to shared hook to avoid duplication between CassieSection/CassieWidget
// Duplicated: getContext(), GREETING, sanitizeInput(), processLocations()
// Consider: createCustomHook('useCasie') or context provider

/**
 * Quick prompt buttons for common queries
 * These are shown on first open to guide users
 * @constant {string[]}
 */
const QUICK_PROMPTS = [
  "Where is the library?",
  "Find restaurants",
  "Show pharmacies",
  "Where is the clinic?"
];

function CassieWidget({ currentSection = 'HOME', selectedService = null, userLocation = null, onNavigateToLocation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: GREETING }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbLocations, setDbLocations] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getStaticLocations(supabase).then(setDbLocations);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build context for AI
  const getContext = () => {
    const pageNames = {
      'HOME': 'Home / Services',
      'MAP': 'Map',
      'ACCOUNT': 'Account',
      'LOGIN': 'Login',
      'REGISTER': 'Register',
      'PERSONAL-PIN': 'My Pins'
    };
    
    const context = {
      currentPage: pageNames[currentSection] || currentSection
    };

    if (selectedService) {
      context.selectedLocation = {
        name: selectedService.name,
        type: selectedService.tags?.join(', ')
      };
    }

    // Add user location for distance calculation
    if (userLocation && userLocation.lat && userLocation.lng) {
      context.userLocation = {
        lat: userLocation.lat,
        lng: userLocation.lng
      };
    }

    return context;
  };

  /**
   * Process AI response locations
   * Merges AI-provided data with local DB fallback
   * 
   * @param {Array} placesData - Locations from AI response
   * @returns {Array} Processed locations with coordinates
   */
  const processLocations = (placesData) => {
    if (!placesData || placesData.length === 0) return [];
    
    const matchedPlaces = [];
    for (const place of placesData) {
      // Trust AI coordinates first, fallback to local DB
      if (place.lat && place.lng) {
        matchedPlaces.push({
          name: place.name,
          address: place.address,
          latitude: place.lat,
          longitude: place.lng
        });
      } else {
        const matched = matchLocation(dbLocations, place.name);
        if (matched) {
          matchedPlaces.push({
            ...matched,
            latitude: matched.latitude || place.lat,
            longitude: matched.longitude || place.lng
          });
        }
      }
    }
    return matchedPlaces;
  };

  /**
   * Add assistant message to chat
   * Handles both text-only and location card responses
   * 
   * @param {string} content - AI response text
   * @param {Array} locations - Optional array of location objects
   */
  const addAssistantMessage = (content, locations = []) => {
    const message = { role: 'assistant', content };
    if (locations.length > 0) {
      message.locations = locations;
    }
    setMessages(prev => [...prev, message]);
  };

  /**
 * Sanitize user input to prevent injection attacks
 * - Limits length to 500 chars
 * - Removes common injection patterns
 * - Trims whitespace
 * 
 * @param {string} text - Raw user input
 * @returns {string} Sanitized text
 */
const sanitizeInput = (text) => {
  if (!text) return '';
  
  let sanitized = text.trim();
  
  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }
  
  // Block obvious prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(previous|all|prior)/i,
    /forget\s+(everything|all|previous)/i,
    /disregard\s+(instructions|system)/i,
    /system\s*:/i,
    /you\s+are\s+(now|a)/i,
    /act\s+as\s+if/i,
    /pretend\s+(to|you)/i
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      // Replace with placeholder but allow the message through with warning
      sanitized = sanitized.replace(pattern, '[ FILTERED ]');
    }
  }
  
  return sanitized;
};

const handleSend = async (overrideMessageOrEvent = null) => {
    const overrideMessage = typeof overrideMessageOrEvent === 'string' ? overrideMessageOrEvent : null;

    // Ignore click/keyboard event objects passed by React handlers.
    if (overrideMessageOrEvent && typeof overrideMessageOrEvent.preventDefault === 'function') {
      overrideMessageOrEvent.preventDefault();
    }

    // Rate limiting: prevent spam
    const now = Date.now();
    
    // Reset daily count at midnight
    if (new Date().toDateString() !== messageCountDate) {
      messageCountDate = new Date().toDateString();
      messageCountToday = 0;
    }
    
    // Check cooldown between messages
    if (now - lastMessageTime < RATE_LIMIT_MS) {
      addAssistantMessage("Please wait a moment before sending another message.");
      return;
    }
    
    // Check daily limit
    if (messageCountToday >= DAILY_MESSAGE_LIMIT) {
      addAssistantMessage("You've reached the daily message limit. Please try again tomorrow!");
      return;
    }
    
    // Check concurrent requests
    if (isLoading) return;
    
    const context = getContext();
    const rawMessage = overrideMessage || input.trim();
    if (!rawMessage) return;

    // Sanitize input
    const userMessage = sanitizeInput(rawMessage);
    if (!userMessage) return;
    
    // Update rate limit counters
    lastMessageTime = now;
    messageCountToday++;

    if (!overrideMessage) {
      setInput('');
    }
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
  
    try {
      const { message, places: placesData } = await sendToCasie(userMessage, context);
      const locations = processLocations(placesData);
      addAssistantMessage(message, locations);
    } catch (error) {
      addAssistantMessage("Sorry, I encountered an error. Please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceClick = (place) => {
    if (onNavigateToLocation) {
      onNavigateToLocation(place);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    await clearCasieHistory();
    resetSession();
    setMessages([{ role: 'assistant', content: GREETING }]);
  };

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    handleSend(prompt);
  };

  return (
    <div className={`cassie-widget ${isOpen ? 'open' : ''}`}>
      {/* Chat Panel */}
      {isOpen && (
        <div className="cassie-chat">
          <div className="cassie-header">
            <div className="cassie-header-info">
              <img src={chatIcon} alt="Casie" className="cassie-avatar" />
              <div>
                <h3>Casie</h3>
                <span className="cassie-status">AI Assistant</span>
              </div>
            </div>
            <div className="cassie-header-actions">
              <button onClick={handleClear} className="cassie-clear-btn" title="Clear chat">
                <img src={clearIcon} alt="Clear" />
              </button>
              <button onClick={() => setIsOpen(false)} className="cassie-close-btn">
                <img src={closeIcon} alt="Close" />
              </button>
            </div>
          </div>

          <div className="cassie-messages">
            {messages.length === 1 && (
              <div className="cassie-quick-prompts">
                {QUICK_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    className="cassie-quick-prompt"
                    onClick={() => handleQuickPrompt(prompt)}
                    disabled={isLoading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`cassie-message ${msg.role}`}>
                <div className="cassie-message-bubble">
                  {msg.content}
                  {msg.locations && msg.locations.length > 0 && (
                    <LocationCards 
                      places={msg.locations} 
                      onPlaceClick={handlePlaceClick}
                      maxCards={MAX_CARDS}
                    />
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="cassie-message assistant">
                <div className="cassie-message-bubble typing">
                  <span className="typing-dot">.</span>
                  <span className="typing-dot">.</span>
                  <span className="typing-dot">.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="cassie-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Casie anything..."
              disabled={isLoading}
            />
            <button 
              onClick={handleSend} 
              disabled={!input.trim() || isLoading}
              className="cassie-send-btn"
            >
              <img src={nextIcon} alt="Send" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        className="cassie-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close Casie' : 'Open Casie'}
      >
        <img src={isOpen ? closeIcon : chatIcon} alt={isOpen ? 'Close' : 'Chat'} />
      </button>
    </div>
  );
}

export default CassieWidget;