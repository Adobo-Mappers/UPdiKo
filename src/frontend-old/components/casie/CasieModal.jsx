import './CasieModal.css';

function CasieModal({ place, onConfirm, onCancel }) {
  if (!place) return null;

  return (
    <div className="casie-modal-overlay" onClick={onCancel}>
      <div className="casie-modal" onClick={(e) => e.stopPropagation()}>
        <div className="casie-modal-header">
          <span className="casie-modal-icon">📍</span>
          <h3>Go to this location?</h3>
        </div>
        
        <div className="casie-modal-content">
          <p className="casie-modal-place-name">{place.name}</p>
          <p className="casie-modal-place-address">{place.address}</p>
        </div>

        <div className="casie-modal-actions">
          <button className="casie-modal-btn casie-modal-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="casie-modal-btn casie-modal-btn-confirm" onClick={onConfirm}>
            Go
          </button>
        </div>
      </div>
    </div>
  );
}

export default CasieModal;