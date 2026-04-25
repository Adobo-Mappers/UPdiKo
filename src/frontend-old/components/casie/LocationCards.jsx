import './LocationCards.css';

function LocationCards({ places, onPlaceClick, maxCards = 3 }) {
  const displayPlaces = places.slice(0, maxCards);

  if (!displayPlaces || displayPlaces.length === 0) {
    return null;
  }

  return (
    <div className="location-cards">
      <h4 className="location-cards-title">Locations in Miagao</h4>
      <div className="location-cards-container">
        {displayPlaces.map((place, index) => (
          <button
            key={index}
            className="location-card"
            onClick={() => onPlaceClick(place)}
          >
            <div className="location-card-info">
              <span className="location-card-name">{place.name}</span>
              <span className="location-card-address">{place.address}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LocationCards;