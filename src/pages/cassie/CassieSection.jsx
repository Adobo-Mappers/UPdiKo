import { useState, useRef, useEffect } from 'react';
import { sendToCasie, clearCasieHistory } from '../../services/cassieService';
import { getStaticLocations, matchLocation } from '../../services/locations.js';
import LocationCards from '../../components/casie/LocationCards';
import CasieModal from '../../components/casie/CasieModal';
import chatIcon from '../../assets/images/icon/chatIcon.svg';
import backIcon from '../../assets/images/icon/back-icon.png';
import nextIcon from '../../assets/images/icon/next-icon.png';
import saveIcon from '../../assets/images/icon/save-icon.png';
import './CassieSection.css';

const GREETING = "Hi! I'm Casie, your friendly guide to Miagao. How can I help you explore today?";
const MAX_CARDS = parseInt(import.meta.env.VITE_CASIE_MAX_CARDS) || 3;

function CassieSection({ currentSection = 'HOME', selectedService = null, onClose, onNavigateToLocation }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: GREETING }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [dbLocations, setDbLocations] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    getStaticLocations().then(setDbLocations);
  }, []);

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

    return context;
  };

  const parseResponse = (response) => {
    let places = null;
    let cleanText = response;

    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed.type === 'locations' && parsed.places) {
          places = parsed.places;
          cleanText = response.replace(jsonMatch[0], '').trim();
        }
      }
      
      if (!places) {
        const plainJson = response.match(/\{[\s\S]*"type"\s*:\s*"locations"[\s\S]*\}/);
        if (plainJson) {
          const parsed = JSON.parse(plainJson[0].trim());
          if (parsed.places) {
            places = parsed.places;
            cleanText = response.replace(plainJson[0], '').trim();
          }
        }
      }

      if (!places) {
        const inlineJson = response.match(/"places"\s*:\s*\[([\s\S]*?)\]/);
        if (inlineJson) {
          try {
            const parsed = JSON.parse('{"places": [' + inlineJson[1] + ']}');
            if (parsed.places && parsed.places.length > 0) {
              places = parsed.places;
              cleanText = response.replace(inlineJson[0], '').trim();
            }
          } catch (err) {
            console.log('Failed to parse inline JSON');
          }
        }
      }
    } catch (e) {
      console.log('Failed to parse JSON from response');
    }

    cleanText = cleanText
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/\{[\s\S]*?"type"\s*:\s*"locations"[\s\S]*?\}/g, '')
      .replace(/\{[\s\S]*?"places"\s*:\s*\[[\s\S]*?\]\}/g, '')
      .trim();

    if (places && places.length > 0) {
      const matchedPlaces = [];
      for (const place of places) {
        const matched = matchLocation(dbLocations, place.name);
        if (matched) {
          matchedPlaces.push(matched);
        }
      }

      if (matchedPlaces.length === 0 && places.length > 0) {
        cleanText = cleanText + "\n\nI couldn't find any of those locations in my database. Try a different search.";
        places = null;
      } else {
        places = matchedPlaces;
      }
    }

    return { places, cleanText };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { response } = await sendToCasie(userMessage, getContext());
      
      const { places, cleanText } = parseResponse(response);
      
      if (places && places.length > 0) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: cleanText,
          locations: places
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    await clearCasieHistory();
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
          <img src={saveIcon} alt="Clear" />
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
          onKeyPress={handleKeyPress}
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