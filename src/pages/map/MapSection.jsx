import './MapSection.css';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import searchIcon from '../../assets/images/icon/search-icon.png';
import homeIcon from '../../assets/images/icon/home-icon.png';
import mapIcon from '../../assets/images/icon/map-pin-icon.png';
import accountIcon from '../../assets/images/icon/user-icon.png';
import compassIcon from '../../assets/images/icon/compass-icon.png';
import closeIcon from '../../assets/images/icon/close-icon.png';
import nextIcon from '../../assets/images/icon/next-icon.png';
import SearchWithHistory from '../../components/map/SearchWithHistory.jsx';
import MapView from '../../components/map/MapView.jsx';
import CassieWidget from '../../components/cassie/CassieWidget.jsx';
import { useUnifiedLocations } from '../../hooks/useUnifiedLocations.js';
import { reverseGeocode } from '../../utils/geocoding.js';
import { uploadPinImage } from '../../services/storageService.js';
import { addPinnedLocationToDB, getCurrentUser } from '../../services/supabase.js';

function MapSection({ setAppSection, service, setAppService }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showCreatePin, setShowCreatePin] = useState(false);
  const [pinName, setPinName] = useState('');
  const [pinAddress, setPinAddress] = useState('');
  const [pinDescription, setPinDescription] = useState('');
  const [pinTags, setPinTags] = useState('');
  const [pinImageFile, setPinImageFile] = useState(null);
  const [pinLatitude, setPinLatitude] = useState(null);
  const [pinLongitude, setPinLongitude] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 10.641944, lng: 122.235556, zoom: 16 });
  const [userCurrentLocation, setUserCurrentLocation] = useState(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [mapBearing, setMapBearing] = useState(0);
  const watchIdRef = useRef(null);
  const reverseGeocodeControllerRef = useRef(null);
  const { publicLocations, userLocations, unifiedLocations } = useUnifiedLocations(user?.id);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      return undefined;
    }

    const handleSuccess = (position) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setUserCurrentLocation(location);

      if (trackingEnabled) {
        setMapCenter((previous) => ({
          ...previous,
          lat: location.lat,
          lng: location.lng,
        }));
      }
    };

    const handleError = (error) => {
      console.error('Error getting user location:', error);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [trackingEnabled]);

  useEffect(() => {
    if (!service) {
      return;
    }

    const latitude = Number(service.latitude);
    const longitude = Number(service.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      setMapCenter({ lat: latitude, lng: longitude, zoom: 17 });
    }
  }, [service]);

  const handleRecenter = () => {
    if (!userCurrentLocation) {
      alert('User location is not available.');
      return;
    }

    setTrackingEnabled((previous) => !previous);
    setMapCenter({
      lat: userCurrentLocation.lat,
      lng: userCurrentLocation.lng,
      zoom: 17,
    });
  };

  const handleCloseCreatePin = () => {
    reverseGeocodeControllerRef.current?.abort();
    setShowCreatePin(false);
    setPinName('');
    setPinAddress('');
    setPinDescription('');
    setPinTags('');
    setPinImageFile(null);
    setPinLatitude(null);
    setPinLongitude(null);
  };

  const handleOpenCreatePin = async (coords = null) => {
    if (!user) {
      alert('Please log in first to create personal pins.');
      return;
    }

    if (!coords) {
      setShowCreatePin(true);
      return;
    }

    setPinLatitude(coords.lat);
    setPinLongitude(coords.lng);
    setPinAddress('Loading address...');
    setShowCreatePin(true);

    reverseGeocodeControllerRef.current?.abort();
    reverseGeocodeControllerRef.current = new AbortController();

    try {
      const address = await reverseGeocode(coords.lat, coords.lng, {
        signal: reverseGeocodeControllerRef.current.signal,
      });
      setPinAddress(address);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setPinAddress('Miagao, Iloilo');
      }
    }
  };

  const handleAddPinnedLocation = async () => {
    if (!user || pinLatitude === null || pinLongitude === null) {
      return;
    }

    try {
      let imageUrl = null;
      if (pinImageFile) {
        imageUrl = await uploadPinImage(pinImageFile, user.id);
      }

      await addPinnedLocationToDB(user.id, {
        locationName: pinName || 'Untitled Pin',
        address: pinAddress || 'Miagao, Iloilo',
        latitude: Number(pinLatitude),
        longitude: Number(pinLongitude),
        description: pinDescription,
        tags: pinTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        imageUrl,
      });

      await queryClient.invalidateQueries({ queryKey: ['user-locations', user.id] });
      handleCloseCreatePin();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCenterToPin = (latitude, longitude, zoomLevel = 17) => {
    setTrackingEnabled(false);
    setMapCenter({ lat: latitude, lng: longitude, zoom: zoomLevel });
  };

  return (
    <div className="MapSection">
      <header className="inactive-search-layout">
        <section className="search-container">
          <img src={searchIcon} className="icon" alt="" />
          <SearchWithHistory
            locations={unifiedLocations}
            initialValue={service?.name || ''}
            onSelectLocation={(location) => {
              setAppService(location);
              handleCenterToPin(Number(location.latitude), Number(location.longitude));
            }}
          />
        </section>
      </header>

      <section className="map">
        <div className="map-container">
          <MapView
            mapCenter={mapCenter}
            currentCoords={userCurrentLocation}
            trackingEnabled={trackingEnabled}
            selectedService={service}
            publicLocations={publicLocations}
            userLocations={userLocations}
            currentUser={user}
            onMapClickForPin={handleOpenCreatePin}
            onClosePinForm={handleCloseCreatePin}
            onMarkerClick={handleCenterToPin}
            bearing={mapBearing}
            onBearingChange={setMapBearing}
          />
        </div>
      </section>

      {showCreatePin && (
        <div className="create-pin-sheet">
          <div className="sheet-header">
            <h2>Create Pin</h2>
            <span className="close-btn" onClick={handleCloseCreatePin}>
              <img src={closeIcon} alt="" />
            </span>
          </div>

          <hr className="separator" />

          <div className="sheet-inputs">
            <div className="pin-info-form">
              <input
                className="info-input"
                placeholder="Name"
                value={pinName}
                onChange={(event) => setPinName(event.target.value)}
              />
              <input
                className="info-input"
                placeholder="Address"
                value={pinAddress}
                onChange={(event) => setPinAddress(event.target.value)}
              />
              <input
                className="info-input"
                placeholder="Tags (comma separated)"
                value={pinTags}
                onChange={(event) => setPinTags(event.target.value)}
              />
            </div>

            <div className="description-input">
              <textarea
                className="info-input"
                placeholder="Description"
                value={pinDescription}
                onChange={(event) => setPinDescription(event.target.value)}
              />
            </div>

            <input
              className="info-input"
              type="file"
              accept="image/*"
              onChange={(event) => setPinImageFile(event.target.files?.[0] || null)}
            />
          </div>

          <div className="confirm-container">
            <span className="confirm-pin-btn btn" onClick={handleAddPinnedLocation}>
              <img src={nextIcon} alt="" />
            </span>
          </div>
        </div>
      )}

      <section className="controls">
        <button
          className={`current-location-btn ${trackingEnabled ? 'active-tracking' : ''}`}
          onClick={handleRecenter}
        >
          <img className="current-location-img" src={compassIcon} alt="" />
        </button>
        <CassieWidget
          currentSection="MAP"
          selectedService={service}
          userLocation={userCurrentLocation}
          onNavigateToLocation={(location) => {
            setAppService(location);
            handleCenterToPin(Number(location.latitude), Number(location.longitude));
          }}
        />
      </section>

      <footer>
        <nav>
          <ul>
            <li
              className="navigation btn"
              onClick={() => {
                setAppService(null);
                setAppSection('HOME');
              }}
            >
              <img className="icon" src={homeIcon} alt="" />
              <p className="label">Service</p>
            </li>
            <li className="navigation active btn" onClick={() => setAppSection('MAP')}>
              <img className="icon" src={mapIcon} alt="" />
              <p className="label">Map</p>
            </li>
            <li
              className="navigation btn"
              onClick={() => {
                setAppService(null);
                setAppSection(user ? 'ACCOUNT' : 'LOGIN');
              }}
            >
              <img className="icon" src={accountIcon} alt="" />
              <p className="label">Account</p>
            </li>
          </ul>
        </nav>
      </footer>
    </div>
  );
}

export default MapSection;
