import { useState, useRef, useEffect } from 'react';
import { sendToCasie, clearCasieHistory, resetSession } from '../../services/cassieService';
import LocationCards from '../../components/casie/LocationCards';
import CasieModal from '../../components/casie/CasieModal';
import chatIcon from '../../assets/images/icon/chatIcon.svg';
import backIcon from '../../assets/images/icon/back-icon.png';
import nextIcon from '../../assets/images/icon/next-icon.png';
import clearIcon from '../../assets/images/icon/broom.svg';
import './CassieSection.css';

const GREETING = "Hi! I'm Casie, your friendly guide to Miagao. How can I help you explore today?";
const MAX_CARDS = parseInt(import.meta.env.VITE_CASIE_MAX_CARDS) || 3;

// Rate limiting configuration
const RATE_LIMIT_MS = 2000;          // 2 seconds between messages
const DAILY_MESSAGE_LIMIT = 50;      // Max messages per day

// Track rate limiting (in-memory)
let lastMessageTime = 0;
let messageCountToday = 0;
let messageCountDate = new Date().toDateString();

function CassieSection({ currentSection = 'HOME', selectedService = null, userLocation = null, onClose, onNavigateToLocation }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: GREETING }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    if (userLocation && userLocation.lat && userLocation.lng) {
      context.userLocation = {
        lat: userLocation.lat,
        lng: userLocation.lng
      };
    }

    return context;
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
        sanitized = sanitized.replace(pattern, '[ FILTERED ]');
      }
    }
    
    return sanitized;
  };

  const handleSend = async () => {
    // Debug: log when handler is invoked to verify click events
    try { console.log('[Casie] handleSend invoked', { input, isLoading }); } catch (e) {}
    // Rate limiting: prevent spam
    const now = Date.now();
    
    // Reset daily count at midnight
    if (new Date().toDateString() !== messageCountDate) {
      messageCountDate = new Date().toDateString();
      messageCountToday = 0;
    }
    
    // Check cooldown
    if (now - lastMessageTime < RATE_LIMIT_MS) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Please wait a moment before sending another message." 
      }]);
      return;
    }
    
    // Check daily limit
    if (messageCountToday >= DAILY_MESSAGE_LIMIT) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "You've reached the daily message limit. Please try again tomorrow!" 
      }]);
      return;
    }
    
    if (!input.trim() || isLoading) return;

    const userMessage = sanitizeInput(input.trim());
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    // Update rate limit counters
    lastMessageTime = now;
    messageCountToday++;

    try {
      const { message, places } = await sendToCasie(userMessage, getContext());
      
      if (places && places.length > 0) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: message,
          locations: places
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: message }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error. Please try again!" 
      }]);
    } finally {
      setIsLoading(false);
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

  const handleBack = () => {
    onClose();
  };

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
    setShowModal(true);
  };

  const handleConfirmNavigate = () => {
    if (selectedPlace && onNavigateToLocation) {
      onNavigateToLocation(selectedPlace);
    }
    setShowModal(false);
    setSelectedPlace(null);
    onClose();
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setSelectedPlace(null);
  };

  return (
    <div className="cassie-section">
      <header className="cassie-header">
        <button className="cassie-back-btn" onClick={handleBack}>
          <img src={backIcon} alt="Back" className="back-icon-white" />
        </button>
        <div className="cassie-header-info">
          <img src={chatIcon} alt="Casie" className="cassie-avatar" />
          <div>
            <h3>Casie</h3>
            <span className="cassie-status">AI Assistant</span>
          </div>
        </div>
        <button onClick={handleClear} className="cassie-clear-btn" title="Clear chat">
          <img src={clearIcon} alt="Clear" />
        </button>
      </header>

      <div className="cassie-messages">
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

      <footer className="cassie-input-area">
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
      </footer>

      {showModal && selectedPlace && (
        <CasieModal 
          place={selectedPlace}
          onConfirm={handleConfirmNavigate}
          onCancel={handleCancelModal}
        />
      )}
    </div>
  );
}

export default CassieSection;