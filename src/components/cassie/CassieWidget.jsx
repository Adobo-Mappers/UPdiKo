import { useState, useRef, useEffect } from 'react';
import { sendToCasie, clearCasieHistory, resetSession } from '../../services/cassieService';
import { getStaticLocations, matchLocation } from '../../services/locations.js';
import LocationCards from '../../components/casie/LocationCards';
import chatIcon from '../../assets/images/icon/chatIcon.svg';
import closeIcon from '../../assets/images/icon/x.svg';
import nextIcon from '../../assets/images/icon/next-icon.png';
import clearIcon from '../../assets/images/icon/broom.svg';
import './CassieWidget.css';

const GREETING = "Hi! I'm Casie, your friendly guide to Miagao. How can I help you explore today?";
const MAX_CARDS = 3;

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
    getStaticLocations().then(setDbLocations);
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

  const handleSend = async (overrideMessage = null) => {
    const context = getContext();
    const userMessage = overrideMessage || input.trim();
    if (!userMessage || isLoading) return;

    if (!overrideMessage) {
      setInput('');
    }
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
  
    try {
      const { message, places: placesData } = await sendToCasie(userMessage, context);
      
      if (placesData && placesData.length > 0) {
        const matchedPlaces = [];
        for (const place of placesData) {
          // Trust AI's data first - use coordinates if provided
          if (place.lat && place.lng) {
            matchedPlaces.push({
              name: place.name,
              address: place.address,
              latitude: place.lat,
              longitude: place.lng
            });
          } else {
            // Fallback to DB match only if AI didn't provide coordinates
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

        if (matchedPlaces.length > 0) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: message,
            locations: matchedPlaces
          }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: message }]);
        }
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