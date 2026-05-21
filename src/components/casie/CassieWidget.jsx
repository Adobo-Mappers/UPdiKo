import './CassieWidget.css';
import { useEffect, useRef, useState } from 'react';
import LocationCards from './LocationCards';
import { useCasie } from '../../hooks/useCasie.js';
import chatIcon from '../../assets/images/icon/chatIcon.svg';
import cassIcon from '../../assets/images/icon/cass-ai.png';
import closeIcon from '../../assets/images/icon/x.svg';
import nextIcon from '../../assets/images/icon/next-icon.png';
import clearIcon from '../../assets/images/icon/broom.svg';

const QUICK_PROMPTS = [
  'Where is the library?',
  'Find restaurants',
  'Show pharmacies',
  'Where is the clinic?',
];

function CassieWidget({
  currentSection = 'HOME',
  selectedService = null,
  userLocation = null,
  onNavigateToLocation,
}) {
  const [isOpen, setIsOpen] = useState(false);
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
    <div className={`cassie-widget ${isOpen ? 'open' : ''}`}>
      {isOpen && (
        <div className="cassie-chat">
          <div className="cassie-header">
            <div className="cassie-header-info">
              <img src={cassIcon} alt="Casie" className="cassie-avatar" />
              <div>
                <h3>Casie</h3>
                <span className="cassie-status">AI Assistant</span>
              </div>
            </div>
            <div className="cassie-header-actions">
              <button onClick={clearSession} className="cassie-clear-btn" title="Clear chat">
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
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    className="cassie-quick-prompt"
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`cassie-message ${message.role}`}>
                <div className="cassie-message-bubble">
                  {message.content}
                  {message.locations?.length ? (
                    <LocationCards
                      places={message.locations}
                      onPlaceClick={(place) => {
                        onNavigateToLocation?.(place);
                        setIsOpen(false);
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

          <div className="cassie-input-area">
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
          </div>
        </div>
      )}

      <button
        className="cassie-toggle bg-accent-softer"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={isOpen ? 'Close Casie' : 'Open Casie'}
      >
        <img src={isOpen ? closeIcon : cassIcon} alt={isOpen ? 'Close' : 'Chat'} />
      </button>
    </div>
  );
}

export default CassieWidget;
