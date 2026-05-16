import { useEffect, useRef, useState } from 'react';
import LocationCards from '../../components/casie/LocationCards';
import CasieModal from '../../components/casie/CasieModal';
import { useCasie } from '../../hooks/useCasie.js';
import chatIcon from '../../assets/images/icon/chatIcon.svg';
import backIcon from '../../assets/images/icon/back-icon.png';
import nextIcon from '../../assets/images/icon/next-icon.png';
import clearIcon from '../../assets/images/icon/broom.svg';
import './CassieSection.css';

function CassieSection({
  currentSection = 'HOME',
  selectedService = null,
  userLocation = null,
  onClose,
  onNavigateToLocation,
}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const messagesEndRef = useRef(null);
  const context = {
    currentPage: currentSection,
    selectedLocation: selectedService ? { name: selectedService.name } : null,
    userLocation,
  };
  const { messages, input, isLoading, setInput, sendMessage, clearSession } = useCasie(context);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="cassie-section">
      <header className="cassie-header">
        <button className="cassie-back-btn" onClick={onClose}>
          <img src={backIcon} alt="Back" className="back-icon-white" />
        </button>
        <div className="cassie-header-info">
          <img src={chatIcon} alt="Casie" className="cassie-avatar" />
          <div>
            <h3>Casie</h3>
            <span className="cassie-status">AI Assistant</span>
          </div>
        </div>
        <button onClick={clearSession} className="cassie-clear-btn" title="Clear chat">
          <img src={clearIcon} alt="Clear" />
        </button>
      </header>

      <div className="cassie-messages">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`cassie-message ${message.role}`}>
            <div className="cassie-message-bubble">
              {message.content}
              {message.locations?.length ? (
                <LocationCards
                  places={message.locations}
                  onPlaceClick={(place) => {
                    setSelectedPlace(place);
                    setShowModal(true);
                  }}
                />
              ) : null}
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
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask Casie anything..."
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          className="cassie-send-btn"
        >
          <img src={nextIcon} alt="Send" />
        </button>
      </footer>

      {showModal && selectedPlace ? (
        <CasieModal
          place={selectedPlace}
          onCancel={() => {
            setShowModal(false);
            setSelectedPlace(null);
          }}
          onConfirm={() => {
            onNavigateToLocation?.(selectedPlace);
            setShowModal(false);
            setSelectedPlace(null);
            onClose?.();
          }}
        />
      ) : null}
    </div>
  );
}

export default CassieSection;
