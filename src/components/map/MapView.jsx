import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { map, marker } from "leaflet";
import "./MapView.css";

// Placeholder Icons from Leaflet
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Custom Icons
import closeIcon from '../../assets/images/icon/close-icon.png';
import timeIcon from '../../assets/images/icon/time-icon.png';
import userPinIcon from '../../assets/images/icon/5.png';
import communityPinIcon from '../../assets/images/icon/3.png';
import universityPinIcon from '../../assets/images/icon/4.png';
import customPinIcon from '../../assets/images/icon/6.png';

// Getting Static Locations and Routing
import { getStaticLocations, getRoute } from "../../services/locations.js";

import { onAuthStateChangedListener, getPinnedLocationsFromDB, supabase } from "../../services/supabase.js";



// fixes icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom icon for the user's location (assuming a simple blue dot or custom image)
const userIcon = new L.Icon({
    iconUrl: userPinIcon,
    iconSize: [40, 40],
    iconAnchor: [10, 10], // Centered
    className: 'user-location-marker' 
});

const communityIcon = new L.Icon({
    iconUrl: communityPinIcon,
    iconSize: [50, 50],
    iconAnchor: [10, 10], // Centered
    className: 'user-location-marker' 
});

const universityIcon = new L.Icon({
    iconUrl: universityPinIcon,
    iconSize: [50, 50],
    iconAnchor: [10, 10], // Centered
    className: 'user-location-marker' 
});

const customIcon = new L.Icon({
    iconUrl: customPinIcon,
    iconSize: [50, 50],
    iconAnchor: [10, 10], // Centered
    className: 'user-location-marker' 
});

// function LocationMarker({ tempLocation, selectedMarkerInfo, setTempLocation, setSelectedMarkerInfo }) {
//   // listen for a click event on the map
//   useMapEvents({
//     click(e) {
//       if (tempLocation && !(tempLocation && !selectedMarkerInfo)) {
//         // when there is an existing pin, remove it
//         setTempLocation(null);
//         setSelectedMarkerInfo(null);
//       } else {
//         // when there is no pin, show a pin for that location.
//         const newPin = {
//           latitude: e.latlng.lat,
//           longitude: e.latlng.lng,
//           name: "Temporary Pin",
//           type: "Temporary Pin",
//           tags: ["Temporary Pin"],
//           address: `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`, 
//         };
//         setTempLocation(newPin);
//         setSelectedMarkerInfo(newPin);
//       }
//     },
//   });

//   return null;
// }

// REVISED: Component to handle map clicks and open the pin form
function LocationMarker({ tempLocation, setTempLocation, setSelectedMarkerInfo, onMapClickForPin, onClosePinForm, handleMarkerClick }) {
  // Use useMapEvents to listen for a click event on the map
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
        
      // 1. Always remove any existing temporary pin first, according to previous rule
      if (tempLocation) {
        // RULE 1: If a temporary pin exists, remove it and close the form.
        setTempLocation(null);
        setSelectedMarkerInfo(null);
        onClosePinForm();
       } else {
        // RULE 2: If no temporary pin exists, create one and open the form.
        
        // 1. Create the temporary pin data object
        const newPin = {
            latitude: lat,
            longitude: lng,
            name: "Temporary Pin",
            type: "Temporary Pin",
            tags: ["Temporary Pin"],
            address: `${lat}, ${lng}`,
        };

        // 2. Set the temporary pin to be rendered on the map
        handleMarkerClick(newPin, newPin.latitude, newPin.longitude)
        setTempLocation(newPin); 
        setSelectedMarkerInfo(null);
        

        // 3. Trigger the pin creation form in the parent component
        onMapClickForPin({ lat, lng });
      }
    },
  });

  return null;
}

// // responds to location change
// function ChangeView({ center }) {
//   const map = useMap();
//   const prevCenter = useRef(center);
  
//   useEffect(() => {
//     // Only update if center coordinates actually changed
//     if (center && (prevCenter.current[0] !== center[0] || prevCenter.current[1] !== center[1])) {
//       map.setView(center);
//       prevCenter.current = center;
//     }
//   }, [center, map]);

//   return null;
// }

// 1. REVISED: responds to location change, now accepts 'zoom'
function ChangeView({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(center);
  const prevZoom = useRef(zoom); // Track previous zoom

  useEffect(() => {
    const tolerance = 0.000001; 
    const isDifferentCenter = !center || 
                        Math.abs(prevCenter.current[0] - center[0]) > tolerance || 
                        Math.abs(prevCenter.current[1] - center[1]) > tolerance;
    
    const isDifferentZoom = zoom !== undefined && Math.abs(prevZoom.current - zoom) > 0;
    
    if (center && (isDifferentCenter || isDifferentZoom)) {
      // Use the new zoom level if provided, otherwise stick to current map zoom
      const targetZoom = zoom || map.getZoom(); 
      
      map.setView(center, targetZoom, {
          animate: true,
          duration: 0.5
      });
      
      prevCenter.current = center;
      prevZoom.current = targetZoom;
    }
  }, [center, zoom, map]); // Add zoom to dependencies

  return null;
}

// NEW COMPONENT: Displays the user's marker and handles the view tracking
function UserLocationMarker({ coords, trackingEnabled }) {
    const map = useMap();
    const markerRef = useRef(null);

    // useEffect to handle the continuous view update when tracking is ON
    useEffect(() => {
        if (trackingEnabled && coords) {
            // This is handled by the parent's state and ChangeView component now,
            // but we can ensure the view is centered whenever coords update *if* tracking is on
            map.setView([coords.lat, coords.lng], map.getZoom(), {
                animate: true,
                duration: 0.5
            });
        }
    }, [coords, trackingEnabled, map]);

    if (!coords) {
        return null;
    }

    // Coordinates are {lat, lng} objects
    const position = [coords.lat, coords.lng];

    return (
        <Marker 
            position={position}
            icon={userIcon}
            ref={markerRef}
        >
            <Popup>
                You are here.
                {trackingEnabled && <span className="tracking-badge"> (Tracking ON)</span>}
            </Popup>
        </Marker>
    );
}

// // main map element
function MapView({ userLocation, currentCoords, trackingEnabled, selectedService, onMapClickForPin, onClosePinForm, onMarkerClick }) {
  const defaultCenter = [10.641944, 122.235556];
  const [center, setCenter] = useState(defaultCenter);
  const [loading, setLoading] = useState(true);
  const [pinnedLocations, setPinnedLocations] = useState([]);
  const [staticLocations, setStaticLocations] = useState([]); // replaces Miagao/Campus JSON imports
  const [selectedMarkerInfo, setSelectedMarkerInfo] = useState(selectedService);
  const [selectedPanelTab, setSelectedPanelTab] = useState("About");
  const [tempLocation, setTempLocation] = useState(null);

  // States for PostGIS directions using Leaflet
  const [routeCoords, setRouteCoords] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeDestination, setRouteDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  // Extract the zoom level if available (assuming MapSection passed it via userLocation)
  const mapZoom = userLocation?.zoom || 16;

  
  // Function to handle the marker click logic
  const handleMarkerClick = (data, lat, lng) => {
      // 1. Set the selected marker info panel
      setSelectedMarkerInfo(data);
      setTempLocation(null);
      onClosePinForm();
      
      // 2. Center the map using the prop function passed from the parent (MapSection)
      // We pass the desired zoom level (e.g., 17) along with the coordinates.
      if (onMarkerClick) {
          onMarkerClick(lat, lng, 17); 
      }
  };

  const handleServiceClick = (selectedService) => {
    if (!selectedService) return;
    handleMarkerClick(
      { ...selectedService, type: selectedService.location_type ?? "community" },
      parseFloat(selectedService.latitude),
      parseFloat(selectedService.longitude)
    );
  }

  useEffect(() => {
      handleServiceClick(selectedService)
  }, [selectedService])
  useEffect(() => {
    if (userLocation) {
      setCenter([userLocation.lat, userLocation.lng]);
    }
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [userLocation]);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (user) => {
      if (user) {
        const pins = await getPinnedLocationsFromDB(user.id);
        setPinnedLocations(
          pins.map((pin) => ({
            id: pin.id,
            name: pin.locationName,
            latitude: pin.latitude,
            longitude: pin.longitude,
            type: "Pinned",
            address: pin.address,
            description: pin.description,
            contact_info: pin.contact_info || [],
            opening_hours: pin.opening_hours || [],
          }))
        );
      } else {
        setPinnedLocations([]);
      }
    });
    return () => unsubscribe();
  }, []);
  // Replaces static JSON imports — fetch all locations from Supabase static_locations table
  useEffect(() => {
    const fetchStaticLocations = async () => {
      const data = await getStaticLocations();
      setStaticLocations(data);
    };
    fetchStaticLocations();
  }, []);

  if (loading) {
    return (
      <div className="map-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const shouldShowMarker = (facility) => {
    return true;
    
    // Check if facility has a tags array and if it includes the selected service
    return facility.name && facility.name.includes(selectedService.name);
  };

  // NEW COMPONENT: Gets the direction to the location selected from user's current location
  const handleGetDirections = async (destination) => {
    if (!currentCoords) {
      alert("Your location is not available yet.");
      return;
    }

    setIsLoadingRoute(true);
    setRouteDestination(destination);

    try {
      // get route coords for polyline
      const coords = await getRoute(
        currentCoords.lat,
        currentCoords.lng,
        parseFloat(destination.latitude),
        parseFloat(destination.longitude)
      );

      // also fetch distance and duration info
      const url = `https://router.project-osrm.org/route/v1/driving/${currentCoords.lng},${currentCoords.lat};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === "Ok") {
        const route = data.routes[0];
        setRouteInfo({
          distance: (route.distance / 1000).toFixed(2) + " km",
          duration: Math.ceil(route.duration / 60) + " mins"
        });
      }

      setRouteCoords(coords);

    } catch (error) {
      console.error("Directions error:", error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // NEW COMPONENT: removes the routing given
  const handleClearRoute = () => {
    setRouteCoords([]);
    setRouteDestination(null);
    setRouteInfo(null);
  };

  return (
    <div className="MapView">
      <MapContainer 
        center={center} 
        zoom={mapZoom} 
        style={{ width: "100%", height: "100%", zIndex: 0}} 
        zoomControl={false}

        // NEW COMPONENT: Clamps the user only to Miagao
        minZoom={13}
        maxZoom={20}
        maxBounds={[
          [10.55, 122.10],
          [10.78, 122.35],
        ]}
        maxBoundsViscosity={1.0}
        >
        <ChangeView center={center} zoom={mapZoom} />
        {/* Stadia Maps — alidade_smooth_dark theme */}
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
          url={`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_STADIA_API_KEY}`}
          // Light Mode: url={`https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_STADIA_API_KEY}`}        />
          // NEW COMPONENT: Clamps the user only to Miagao
          minZoom={13}
          maxZoom={20}
        />
        {/* Render the user's current location marker and tracking logic */}
        <UserLocationMarker coords={currentCoords} trackingEnabled={trackingEnabled} />
        {routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: '#4A90E2', weight: 5, opacity: 0.8 }}
          />
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
            icon={userIcon} 
            position={[tempLocation.latitude, tempLocation.longitude]} 
            eventHandlers={{ click: () => {handleMarkerClick(tempLocation, tempLocation.latitude, tempLocation.longitude)} }}
          >
             <Popup>
               Clicked Location: <br />
               Lat: {tempLocation.latitude}, <br />
               Lng: {tempLocation.longitude}
             </Popup>
          </Marker>
        )}

        {/* <Marker position={center}>
          <Popup>You are here</Popup>
        </Marker> */}
         {pinnedLocations.map((pin) => (
          <Marker key={pin.id} position={[pin.latitude, pin.longitude]} icon={customIcon} eventHandlers={{ click: () => {handleMarkerClick(pin, pin.latitude, pin.longitude)} }}>
            {/* <Popup>{pin.name}</Popup> */}
          </Marker>
        ))}
        {/* Replaces Miagao.map() and Campus.map() — now sourced from Supabase static_locations */}
        {staticLocations.filter(shouldShowMarker).map((facility) => (
          <Marker
            key={facility.id}
            position={[parseFloat(facility.latitude), parseFloat(facility.longitude)]}
            icon={facility.location_type === "campus" ? universityIcon : communityIcon}
            eventHandlers={{ click: () => {
              handleMarkerClick(
                { ...facility, type: facility.location_type },
                parseFloat(facility.latitude),
                parseFloat(facility.longitude)
              );
            }}}
          >
            {/* <Popup>{facility.name}</Popup> */}
          </Marker>
        ))} 
      </MapContainer>

      {selectedMarkerInfo && (
        <div className="marker-info-panel">

          <div className="panel-handle">
          <h2>{selectedMarkerInfo.name}</h2>
          <span className="close-btn btn" onClick={() => setSelectedMarkerInfo(null)}><img src={closeIcon}></img></span>
          </div>
        
          <div className="directions-container">
            <button
              className="directions-btn btn"
              onClick={() => handleGetDirections(selectedMarkerInfo)}
              disabled={isLoadingRoute}
            >
              {isLoadingRoute ? "Loading route..." : "Get Directions"}
            </button>

            {routeInfo && (
              <div className="route-info">
                <span> 🚗 {routeInfo.distance}</span>
                <span> ⏱ {routeInfo.duration}</span>
                <button className="clear-route-btn btn" onClick={handleClearRoute}>
                  Clear
                </button>
              </div>
            )}
          </div>

          <hr className="separator"></hr>

          <div className="marker-info-header">
            <span className={"header-btn btn " + ((selectedPanelTab == "About") ? "active" : " ")} onClick={() => setSelectedPanelTab("About")}>About</span>
            <span className={"header-btn btn " + ((selectedPanelTab == "Photos") ? "active" : " ")}  onClick={() => setSelectedPanelTab("Photos")}>Photos</span>
          </div>

          {selectedPanelTab === "About" && (
            <div className="marker-info-container">
              <div className="marker-description">
                <p>{selectedMarkerInfo?.tags?.join(", ") ?? ""}</p>
                <p>{selectedMarkerInfo.address}</p>                       
                {selectedMarkerInfo.opening_hours && selectedMarkerInfo.opening_hours.length > 0 && (
                  <div>
                    <br></br>
                    <h3>Opening Hours</h3>
                    <ul>
                      {selectedMarkerInfo.opening_hours.map((hour, index) => (
                        <li key={index}>{hour}</li>
                      ))}
                    </ul>
                  </div>
                )} 

                {selectedMarkerInfo.contact_info && selectedMarkerInfo.contact_info.length > 0 && (
                  <div>
                    <br></br>
                    <h3>Contact Information</h3>
                    <ul>
                      {selectedMarkerInfo.contact_info.map((info, index) => (
                        <li key={index}>{info}</li>
                      ))}
                    </ul>
                  </div>
                )}     
              </div>
            </div>
          )}
          
          {selectedPanelTab === "Photos" && selectedMarkerInfo.images && selectedMarkerInfo.images.length > 0 && (
            <div className="image-container">
              <div className="image-gallery">
                {selectedMarkerInfo.images.map((imgUrl, index) => (
                  <img key={index} className="image" src={imgUrl} alt={`Image ${index + 1}`} />
                ))}
              </div>
            </div>
          )}
          {selectedPanelTab === "Photos" && (selectedMarkerInfo.images == null || (selectedMarkerInfo.images && selectedMarkerInfo.images.length <= 0)) && (
            <div className="image-container">
              <p>No photos available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
};

export default MapView;