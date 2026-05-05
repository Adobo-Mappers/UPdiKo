import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import closeIcon from '../../assets/images/icon/close-icon.png';
import userPinIcon from '../../assets/images/icon/save.png';
import communityPinIcon from '../../assets/images/icon/community.png';
import universityPinIcon from '../../assets/images/icon/upv.png';
import { getRoute } from '../../services/locations.js';
import { getLocationReviews, submitLocationReview } from '../../services/reviewsService.js';
import './MapView.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const userIcon = new L.Icon({
  iconUrl: userPinIcon,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const communityIcon = new L.Icon({
  iconUrl: communityPinIcon,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const universityIcon = new L.Icon({
  iconUrl: universityPinIcon,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function LocationMarker({
  tempLocation,
  setTempLocation,
  setSelectedMarkerInfo,
  onMapClickForPin,
  onClosePinForm,
  handleMarkerClick,
}) {
  useMapEvents({
    click(event) {
      const latitude = event.latlng.lat;
      const longitude = event.latlng.lng;

      if (tempLocation) {
        setTempLocation(null);
        setSelectedMarkerInfo(null);
        onClosePinForm();
        return;
      }

      const nextLocation = {
        id: 'temp-location',
        latitude,
        longitude,
        name: 'Temporary Pin',
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        tags: ['temporary'],
        source: 'USER',
      };

      handleMarkerClick(nextLocation, latitude, longitude);
      setTempLocation(nextLocation);
      setSelectedMarkerInfo(nextLocation);
      onMapClickForPin({ lat: latitude, lng: longitude });
    },
  });

  return null;
}

function ChangeView({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (!center) {
      return;
    }

    map.setView(center, zoom, {
      animate: true,
      duration: 0.5,
    });
  }, [center, zoom, map]);

  return null;
}

function RotationController({ bearing }) {
  const map = useMap();

  useEffect(() => {
    if (map.setBearing) {
      map.setBearing(bearing);
    }
  }, [bearing, map]);

  return null;
}

function UserLocationMarker({ coords, trackingEnabled }) {
  if (!coords) {
    return null;
  }

  return (
    <Marker position={[coords.lat, coords.lng]} icon={userIcon}>
      <Popup>
        You are here.
        {trackingEnabled ? ' Tracking enabled.' : ''}
      </Popup>
    </Marker>
  );
}

function ReviewsPanel({ currentUser, locationId }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['location-reviews', locationId],
    queryFn: () => getLocationReviews(locationId),
    enabled: Boolean(locationId),
  });

  const reviewMutation = useMutation({
    mutationFn: submitLocationReview,
    onSuccess: async () => {
      setComment('');
      await queryClient.invalidateQueries({ queryKey: ['location-reviews', locationId] });
    },
  });

  return (
    <div className="marker-info-container">
      {currentUser ? (
        <div className="marker-description">
          <h3>Leave a Review</h3>
          <label>
            Rating
            <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} star{value > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </label>
          <textarea
            className="info-input"
            value={comment}
            placeholder="Share a quick tip about this place."
            onChange={(event) => setComment(event.target.value)}
          />
          <button
            className="directions-btn btn"
            onClick={() =>
              reviewMutation.mutate({
                locationId,
                userId: currentUser.id,
                userName: currentUser.user_metadata?.display_name || currentUser.email || 'Anonymous',
                rating,
                comment: comment.trim(),
              })
            }
          >
            Save Review
          </button>
        </div>
      ) : (
        <p>Log in to submit a review.</p>
      )}

      <hr className="separator" />

      {isLoading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((review) => (
          <div key={review.id} className="marker-description">
            <strong>{review.userName}</strong>
            <p>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
            <p>{review.comment || 'No written comment.'}</p>
          </div>
        ))
      )}
    </div>
  );
}

function MapView({
  mapCenter,
  currentCoords,
  trackingEnabled,
  selectedService,
  publicLocations,
  userLocations,
  currentUser,
  onMapClickForPin,
  onClosePinForm,
  onMarkerClick,
  bearing,
}) {
  const [selectedMarkerInfo, setSelectedMarkerInfo] = useState(selectedService);
  const [selectedPanelTab, setSelectedPanelTab] = useState('About');
  const [tempLocation, setTempLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const initialCenter = [mapCenter?.lat || 10.641944, mapCenter?.lng || 122.235556];
  const mapZoom = mapCenter?.zoom || 16;

  useEffect(() => {
    if (selectedService) {
      setSelectedMarkerInfo({
        ...selectedService,
        source:
          selectedService.source ||
          (selectedService.locationName || selectedService.location_name ? 'USER' : 'OSM'),
      });
      setSelectedPanelTab('About');
    }
  }, [selectedService]);

  const handleMarkerClick = (location, latitude, longitude) => {
    setTempLocation(null);
    setSelectedMarkerInfo(location);
    onClosePinForm();
    onMarkerClick(latitude, longitude, 17);
  };

  const handleGetDirections = async (destination) => {
    if (!currentCoords) {
      alert('Your location is not available yet.');
      return;
    }

    setIsLoadingRoute(true);

    try {
      const route = await getRoute(
        { lat: currentCoords.lat, lng: currentCoords.lng },
        {
          lat: Number(destination.latitude),
          lng: Number(destination.longitude),
        }
      );

      setRouteCoords(route.coordinates || []);
      setRouteInfo({
        distance: route.distanceMeters
          ? `${(route.distanceMeters / 1000).toFixed(2)} km`
          : 'Unavailable',
        duration: route.durationMinutes ? `${route.durationMinutes} mins` : 'Unavailable',
      });
    } catch (error) {
      console.error('Directions error:', error);
      setRouteCoords([]);
      setRouteInfo({
        distance: 'Unavailable',
        duration: error.message,
      });
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleClearRoute = () => {
    setRouteCoords([]);
    setRouteInfo(null);
  };

  const selectedOpeningHours =
    selectedMarkerInfo?.opening_hours || selectedMarkerInfo?.openingHours || [];
  const selectedContactInfo =
    selectedMarkerInfo?.contact_info || selectedMarkerInfo?.contactInfo || [];
  const selectedImages =
    selectedMarkerInfo?.images || (selectedMarkerInfo?.imageUrl ? [selectedMarkerInfo.imageUrl] : []);

  return (
    <div className="MapView">
      <MapContainer
        center={initialCenter}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%', zIndex: 0 }}
        zoomControl={false}
        minZoom={13}
        maxZoom={20}
        maxBounds={[
          [10.55, 122.1],
          [10.78, 122.35],
        ]}
        maxBoundsViscosity={1.0}
        rotate
        rotateControl={false}
        touchRotate
        touchZoom
      >
        <ChangeView center={[mapCenter.lat, mapCenter.lng]} zoom={mapZoom} />
        <RotationController bearing={bearing} />
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
          url={`https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_STADIA_API_KEY}`}
        />
        <UserLocationMarker coords={currentCoords} trackingEnabled={trackingEnabled} />
        {routeCoords.length > 0 && (
          <Polyline positions={routeCoords} pathOptions={{ color: '#4A90E2', weight: 5 }} />
        )}
        <LocationMarker
          tempLocation={tempLocation}
          setTempLocation={setTempLocation}
          setSelectedMarkerInfo={setSelectedMarkerInfo}
          onMapClickForPin={onMapClickForPin}
          onClosePinForm={onClosePinForm}
          handleMarkerClick={handleMarkerClick}
        />

        {tempLocation && (
          <Marker
            position={[tempLocation.latitude, tempLocation.longitude]}
            icon={userIcon}
            eventHandlers={{
              click: () =>
                handleMarkerClick(
                  tempLocation,
                  tempLocation.latitude,
                  tempLocation.longitude
                ),
            }}
          />
        )}

        {userLocations
          .filter(
            (location) =>
              Number.isFinite(Number(location.latitude)) &&
              Number.isFinite(Number(location.longitude))
          )
          .map((location) => (
          <Marker
            key={location.id}
            position={[Number(location.latitude), Number(location.longitude)]}
            icon={userIcon}
            eventHandlers={{
              click: () =>
                handleMarkerClick(
                  { ...location, source: 'USER' },
                  Number(location.latitude),
                  Number(location.longitude)
                ),
            }}
          />
        ))}

        {publicLocations
          .filter(
            (location) =>
              Number.isFinite(Number(location.latitude)) &&
              Number.isFinite(Number(location.longitude))
          )
          .map((location) => (
          <Marker
            key={location.id}
            position={[Number(location.latitude), Number(location.longitude)]}
            icon={location.location_type === 'campus' ? universityIcon : communityIcon}
            eventHandlers={{
              click: () =>
                handleMarkerClick(
                  { ...location, source: 'OSM' },
                  Number(location.latitude),
                  Number(location.longitude)
                ),
            }}
          />
        ))}
      </MapContainer>

      {selectedMarkerInfo && (
        <div className="marker-info-panel">
          <div className="panel-handle">
            <h2>{selectedMarkerInfo.name}</h2>
            <span className="close-btn btn" onClick={() => setSelectedMarkerInfo(null)}>
              <img src={closeIcon} alt="" />
            </span>
          </div>

          <div className="directions-container">
            <button
              className="directions-btn btn"
              onClick={() => handleGetDirections(selectedMarkerInfo)}
              disabled={isLoadingRoute}
            >
              {isLoadingRoute ? 'Loading route...' : 'Get Directions'}
            </button>

            {routeInfo && (
              <div className="route-info">
                <span>{routeInfo.distance}</span>
                <span>{routeInfo.duration}</span>
                <button className="clear-route-btn btn" onClick={handleClearRoute}>
                  Clear
                </button>
              </div>
            )}
          </div>

          <hr className="separator" />

          <div className="marker-info-header">
            <span
              className={selectedPanelTab === 'About' ? 'header-btn btn active' : 'header-btn btn'}
              onClick={() => setSelectedPanelTab('About')}
            >
              About
            </span>
            <span
              className={selectedPanelTab === 'Photos' ? 'header-btn btn active' : 'header-btn btn'}
              onClick={() => setSelectedPanelTab('Photos')}
            >
              Photos
            </span>
            {selectedMarkerInfo.source === 'OSM' && (
              <span
                className={
                  selectedPanelTab === 'Reviews' ? 'header-btn btn active' : 'header-btn btn'
                }
                onClick={() => setSelectedPanelTab('Reviews')}
              >
                Reviews
              </span>
            )}
          </div>

          {selectedPanelTab === 'About' && (
            <div className="marker-info-container">
              <div className="marker-description">
                <p>{(selectedMarkerInfo.tags || []).join(', ')}</p>
                <p>{selectedMarkerInfo.address}</p>
                {selectedMarkerInfo.description ? <p>{selectedMarkerInfo.description}</p> : null}

                {Array.isArray(selectedOpeningHours) && selectedOpeningHours.length > 0 && (
                    <div>
                      <h3>Opening Hours</h3>
                      <ul>
                        {selectedOpeningHours.map((hour) => (
                          <li key={hour}>{hour}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {Array.isArray(selectedContactInfo) && selectedContactInfo.length > 0 && (
                    <div>
                      <h3>Contact Information</h3>
                      <ul>
                        {selectedContactInfo.map((info) => (
                          <li key={info}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          )}

          {selectedPanelTab === 'Photos' && (
            <div className="image-container">
              {selectedImages.length > 0 ? (
                <div className="image-gallery">
                  {selectedImages.filter(Boolean).map((url) => (
                    <img key={url} className="image" src={url} alt={selectedMarkerInfo.name} />
                  ))}
                </div>
              ) : (
                <p>No photos available.</p>
              )}
            </div>
          )}

          {selectedPanelTab === 'Reviews' && (
            <ReviewsPanel
              currentUser={currentUser}
              locationId={Number(selectedMarkerInfo.recordId || selectedMarkerInfo.id)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default MapView;
