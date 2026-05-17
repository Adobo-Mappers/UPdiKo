// Important Dependencies
import React, { useEffect, useState, useRef, act} from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline} from "react-leaflet";
import { useParams, useNavigate } from "react-router-dom";
import { TAG_GROUPS } from './../../../utils/servicecoding.js'
import "leaflet/dist/leaflet.css";
import L, { map, marker } from "leaflet";
import "./MapView.css";
import "leaflet-rotate";

import { Link } from 'react-router-dom';
import { Button } from '../../../components/form';
import { Icon, Carousel, Tag, Profile } from './../../../components/ui';
import { Text, Caption, Heading } from './../../../components/typography'

// Placeholder Icons from Leaflet
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Information Icons
import closeIcon from '../../../assets/images/icon/close-icon.png';
import timeIcon from '../../../assets/images/icon/open-hours-icon.png';

// Custom Icons
import userPinIcon from '../../../assets/images/icon/user.png';

import restaurantPinIcon from '../../../assets/images/icon/restaurant.png';
import cafePinIcon from '../../../assets/images/icon/cafe.png';
import bakeryPinIcon from '../../../assets/images/icon/bakery.png';
import groceryPinIcon from '../../../assets/images/icon/grocery.png';
import giftPinIcon from '../../../assets/images/icon/gift.png';
import hardwarePinIcon from '../../../assets/images/icon/hardware.png';
import printingPinIcon from '../../../assets/images/icon/printing.png';
import beautyPinIcon from '../../../assets/images/icon/beauty.png';
import medicalPinIcon from '../../../assets/images/icon/medical.png';
import pharmacyPinIcon from '../../../assets/images/icon/pharmacy.png';
import financialPinIcon from '../../../assets/images/icon/financial.png';
import universityPinIcon from '../../../assets/images/icon/university.png';
import schoolsPinIcon from '../../../assets/images/icon/schools.png';
import accommodationPinIcon from '../../../assets/images/icon/accommodation.png';
import automotivePinIcon from '../../../assets/images/icon/automotive.png';
import laundryPinIcon from '../../../assets/images/icon/laundry.png';
import tourismPinIcon from '../../../assets/images/icon/tourism.png';
import religiousPinIcon from '../../../assets/images/icon/religious.png';
import entertainmentPinIcon from '../../../assets/images/icon/entertainment.png';
import governmentPinIcon from '../../../assets/images/icon/government.png';
import informationPinIcon from '../../../assets/images/icon/information.png';
import recyclingPinIcon from '../../../assets/images/icon/recycling.png';
import funeralPinIcon from '../../../assets/images/icon/funeral.png';
import shelterPinIcon from '../../../assets/images/icon/shelter.png';
import toiletPinIcon from '../../../assets/images/icon/toilet.png';
import lotteryPinIcon from '../../../assets/images/icon/lottery.png';
import computerPinIcon from '../../../assets/images/icon/computer.png';
import communityPinIcon from '../../../assets/images/icon/community.png';
import customPinIcon from '../../../assets/images/icon/save.png';

// Getting Static Locations and Routing
import { getStaticLocations, getRoute } from "../../../services/locations.js";
// Getting Pinned Locations and supabase connection
import { onAuthStateChangedListener, getPinnedLocationsFromDB, addPinnedLocationToDB, supabase, getCurrentUser } from "../../../services/supabase.js";
import { getLocationReviews, submitLocationReview, getLocationReviewOfUser } from "../../../services/reviewsService.js";
import Yu from './../../../assets/images/profile/profile.jpg'
import { hasServiceCache, getAllServicesFromCache, fetchServicesFromServer, getServiceFromCache } from '../../../services/service-handler.js';


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
    iconSize: [50, 50],
    iconAnchor: [25, 50], // tip of pin sits on coordinate
    className: 'user-location-marker' 
});

const restaurantIcon = new L.Icon({
    iconUrl: restaurantPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const cafeIcon = new L.Icon({
    iconUrl: cafePinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const bakeryIcon = new L.Icon({
    iconUrl: bakeryPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const groceryIcon = new L.Icon({
    iconUrl: groceryPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const giftIcon = new L.Icon({
    iconUrl: giftPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const hardwareIcon = new L.Icon({
    iconUrl: hardwarePinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const printingIcon = new L.Icon({
    iconUrl: printingPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const beautyIcon = new L.Icon({
    iconUrl: beautyPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const medicalIcon = new L.Icon({
    iconUrl: medicalPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const pharmacyIcon = new L.Icon({
    iconUrl: pharmacyPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const financialIcon = new L.Icon({
    iconUrl: financialPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const universityIcon = new L.Icon({
    iconUrl: universityPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const schoolsIcon = new L.Icon({
    iconUrl: schoolsPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const accommodationIcon = new L.Icon({
    iconUrl: accommodationPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const automotiveIcon = new L.Icon({
    iconUrl: automotivePinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const laundryIcon = new L.Icon({
    iconUrl: laundryPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const tourismIcon = new L.Icon({
    iconUrl: tourismPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const religiousIcon = new L.Icon({
    iconUrl: religiousPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const entertainmentIcon = new L.Icon({
    iconUrl: entertainmentPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const governmentIcon = new L.Icon({
    iconUrl: governmentPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const informationIcon = new L.Icon({
    iconUrl: informationPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const recyclingIcon = new L.Icon({
    iconUrl: recyclingPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const funeralIcon = new L.Icon({
    iconUrl: funeralPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const shelterIcon = new L.Icon({
    iconUrl: shelterPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const toiletIcon = new L.Icon({
    iconUrl: toiletPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const lotteryIcon = new L.Icon({
    iconUrl: lotteryPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const computerIcon = new L.Icon({
    iconUrl: computerPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    className: 'user-location-marker' 
});

const communityIcon = new L.Icon({
    iconUrl: communityPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30], // tip of pin sits on coordinate
    className: 'user-location-marker' 
});

const customIcon = new L.Icon({
    iconUrl: customPinIcon,
    iconSize: [30, 30],
    iconAnchor: [15, 30], // tip of pin sits on coordinate
    className: 'user-location-marker' 
});

const iconMapping = {
  restaurant: restaurantIcon,
  cafe: cafeIcon,
  bakery: bakeryIcon,
  grocery: groceryIcon,
  gift: giftIcon,
  hardware: hardwareIcon,
  printing: printingIcon,
  beauty: beautyIcon,
  medical: medicalIcon,
  pharmacy: pharmacyIcon,
  financial: financialIcon,
  university: universityIcon,
  schools: schoolsIcon,
  accommodation: accommodationIcon,
  automotive: automotiveIcon,
  laundry: laundryIcon,
  tourism: tourismIcon,
  religious: religiousIcon,
  entertainment: entertainmentIcon,
  government: governmentIcon,
  information: informationIcon,
  recycling: recyclingIcon,
  funeral: funeralIcon,
  shelter: shelterIcon,
  toilet: toiletIcon,
  lottery: lotteryIcon,
  computer: computerIcon,
  community: communityIcon // Default fallback
};

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
      const targetZoom = zoom || map.getZoom();

      // Use targetZoom for the projection so the pixel offset is correct
      // at the zoom level we're animating to.
      // offsetPx shifts the view down so the pin appears in the upper portion
      // of the screen above the info panel (panel is ~55dvh tall).
      const offsetPx = window.innerHeight * 0.275; // ~half of 55dvh
      const targetPoint = map.project(center, targetZoom);
      const offsetPoint = targetPoint.add([0, offsetPx]);
      const offsetLatLng = map.unproject(offsetPoint, targetZoom);

      map.setView(offsetLatLng, targetZoom, {
        animate: true,
        duration: 0.6,
        easeLinearity: 0.5,
      });

      prevCenter.current = center;
      prevZoom.current = targetZoom;
    }
  }, [center, zoom, map]);

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
            <Popup autoPan={false}>
                You are here.
                {trackingEnabled && <span className="tracking-badge"> (Tracking ON)</span>}
            </Popup>
        </Marker>
    );
}

// NEW COMPONENT: Controls the Map rotation
function RotationController({ bearing, setBearing }) {
  const map = useMap();

  useEffect(() => {
    if (map.setBearing) {
      map.setBearing(bearing);
    }
  }, [bearing, map]);

  return null;
}



// // main map element
export function MapView({ userLocation, currentCoords, trackingEnabled, selectedService, onMapClickForPin, onClosePinForm, onMarkerClick, bearing, onBearingChange, onRouteNeeded, setRatingSession, isRating, setRating, activeTag}) {
  const navigate = useNavigate();

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

  // States for saving — wired to addPinnedLocationToDB
  const [isSaved, setSaved] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);

  async function toggleSaveButton() {
    if (!user || !selectedMarkerInfo || isSavingPin) return;
    if (isSaved) { setSaved(false); return; }
    setIsSavingPin(true);
    try {
      await addPinnedLocationToDB(user.id, {
        locationName: selectedMarkerInfo.name,
        address: selectedMarkerInfo.address || 'Miagao, Iloilo',
        latitude: parseFloat(selectedMarkerInfo.latitude),
        longitude: parseFloat(selectedMarkerInfo.longitude),
        description: selectedMarkerInfo.additional_info?.text_based?.[0] || '',
        tags: selectedMarkerInfo.tags || [],
        imageUrl: selectedMarkerInfo.images?.[0] || null,
      });
      setSaved(true);
    } catch (e) {
      console.error('Save pin failed:', e);
    } finally {
      setIsSavingPin(false);
    }
  }

  // user auth
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true); 
    useEffect(() => {
        const unsubscribe = onAuthStateChangedListener((user) => {
            setUser(user);
            setAuthLoading(false); 
        });
        return () => unsubscribe(); 
    }, []);

    // get service id
    const { id } = useParams();
    console.log(id);
    // fetch service from cache
    const [service, setService] = useState(null);
    useEffect(() => {
        async function loadService() {
            if (!id) return;
            if (!hasServiceCache()) {
                await fetchServicesFromServer();
            }
            setService(getServiceFromCache(id));
            setLoading(false);
        }
        loadService();
    }, [id]);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [savedRating, setSavedRating] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewModal, setReviewModal] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
      if (!id) return;
      getLocationReviews(Number(id))
          .then(setReviews)
          .catch(() => setReviews([]));
  }, [id]);

  useEffect(() => {
      if (!user) return;
      getLocationReviewOfUser(id, user.id)
          .then(data => { 
              setReviewRating(data); 
              setSavedRating(data); 
          })
          .catch(() => {
              setReviewRating(0);
              setSavedRating(0);
          });
  }, [authLoading])

  useEffect(() => {
      if (reviewModal === false) {
          setReviewRating(savedRating);
      }
  }, [reviewModal])

  async function handleSubmitReview() {
      if (!user || reviewRating === 0) return;
      setSubmittingReview(true);
      try {
          await submitLocationReview({
              locationId: Number(id),
              userId: user.id,
              userName: user.user_metadata?.display_name ?? user.email,
              rating: reviewRating,
              comment: reviewComment,
          });
          const updated = await getLocationReviews(Number(id));
          setReviews(updated);
          setSavedRating(reviewRating);
          setReviewComment('');
      } catch (e) {
          console.error('Review submit failed:', e);
      } finally {
        setReviewModal(false);
        setSubmittingReview(false); 
      }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;


  // Extract the zoom level if available (assuming MapSection passed it via userLocation)
  const mapZoom = userLocation?.zoom || 16;

  // for dragging
  const dragY = useRef(0);
  const startY = useRef(null);
  const panelRef = useRef(null);

  function onDragStart(e) {
      startY.current = e.touches?.[0]?.clientY ?? e.clientY;
      panelRef.current.style.transition = 'none';
  }

  function onDragMove(e) {
      if (startY.current === null) return;
      const delta = (e.touches?.[0]?.clientY ?? e.clientY) - startY.current;
      if (delta < 0) return; // block dragging up
      dragY.current = delta;
      panelRef.current.style.transform = `translateY(${delta}px)`;
  }

  function onDragEnd() {
    setSelectedMarkerInfo(null);
      if (dragY.current > 200) {
      } else {
          panelRef.current.style.transition = 'transform 0.3s ease';
          panelRef.current.style.transform = 'translateY(0)';
      }
      dragY.current = 0;
      startY.current = null;
  }


  
  // Function to handle the marker click logic
  const handleMarkerClick = (data, lat, lng, shouldRoute = false) => {
      // 1. Set the selected marker info panel
      setSelectedMarkerInfo(data);
      setTempLocation(null);
      onClosePinForm();

      // 2. Center the map on the clicked marker.
      //    The rightward shift was caused by wrong iconAnchor values, not the pan itself.
      if (onMarkerClick) {
          onMarkerClick(lat, lng, 17);
          navigate(`/map/${data.id ? data.id : ""}`);
      }
      
      // 3. Calculate route if requested (e.g., from Cassie navigation)
      if (shouldRoute) {
        handleGetDirections(data);
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
            tags: pin.tags || [],
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
  }, [activeTag]);
  // Replaces static JSON imports — fetch all locations from Supabase static_locations table
  useEffect(() => {
    const fetchStaticLocations = async () => {
      const data = await getStaticLocations(supabase);
      const valid = data.filter(r => !isNaN(parseFloat(r.latitude)) && !isNaN(parseFloat(r.longitude)));
      console.log(`🗺 Total loaded: ${data.length} | Valid coords: ${valid.length} | Skipped: ${data.length - valid.length}`);
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
      const startLat = currentCoords.lat;
      const startLng = currentCoords.lng;
      const endLat = parseFloat(destination.latitude);
      const endLng = parseFloat(destination.longitude);

      // Single OSRM call — getRoute returns [lat,lng] pairs for the polyline
      // and we also extract distance/duration from the same response
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== "Ok") {
        console.warn("OSRM routing failed:", data.message);
        return;
      }

      const route = data.routes[0];

      // Polyline coords: GeoJSON is [lng, lat], Leaflet needs [lat, lng]
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      setRouteCoords(coords);

      setRouteInfo({
        distance: (route.distance / 1000).toFixed(2) + " km",
        duration: Math.ceil(route.duration / 60) + " mins",
      });

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

  const getFacilityIcon = (tags) => {
    // Safe parsing fallback if tags are null/undefined
    if (!tags) return communityIcon;
    
    let parsedTags = [];
    try {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch (e) {
      console.error("Failed to parse facility tags JSON array", e);
      return communityIcon;
    }

    // Ensure parsedTags is an array before checking
    if (!Array.isArray(parsedTags)) return communityIcon;

    // Normalize array to lowercase to avoid case-sensitivity bugs
    const activeTags = parsedTags.map(t => String(t).toLowerCase());

    // Match active tags against your specific subcategory lists
    if (activeTags.some(t => ["restaurant", "fast_food", "seafood"].includes(t))) return iconMapping.restaurant;
    if (activeTags.some(t => ["cafe", "beverages"].includes(t))) return iconMapping.cafe;
    if (activeTags.some(t => ["bakery", "pastry"].includes(t))) return iconMapping.bakery;
    if (activeTags.some(t => ["convenience", "variety_store", "marketplace"].includes(t))) return iconMapping.grocery;
    if (activeTags.some(t => ["clothes", "gift", "florist"].includes(t))) return iconMapping.gift;
    if (activeTags.some(t => ["trade", "furniture", "electronics"].includes(t))) return iconMapping.hardware;
    if (activeTags.some(t => ["doityourself"].includes(t))) return iconMapping.printing;
    if (activeTags.some(t => ["beauty"].includes(t))) return iconMapping.beauty;
    if (activeTags.some(t => ["hospital", "clinic", "health_post", "doctors", "dentist"].includes(t))) return iconMapping.medical;
    if (activeTags.some(t => ["pharmacy"].includes(t))) return iconMapping.pharmacy;
    if (activeTags.some(t => ["bank", "money_transfer", "pawnbroker"].includes(t))) return iconMapping.financial;
    if (activeTags.some(t => ["university", "college", "research_institute"].includes(t))) return iconMapping.university;
    if (activeTags.some(t => ["school", "kindergarten", "childcare"].includes(t))) return iconMapping.schools;
    if (activeTags.some(t => ["student_accommodation", "dormitory", "apartment"].includes(t))) return iconMapping.accommodation;
    if (activeTags.some(t => ["car_repair", "motorcycle", "tyres", "fuel", "car_wash", "bicycle", "parking"].includes(t))) return iconMapping.automotive;
    if (activeTags.some(t => ["laundry"].includes(t))) return iconMapping.laundry;
    if (activeTags.some(t => ["attraction", "museum", "artwork"].includes(t))) return iconMapping.tourism;
    if (activeTags.some(t => ["place_of_worship"].includes(t))) return iconMapping.religious;
    if (activeTags.some(t => ["karaoke_box", "events_venue", "bar"].includes(t))) return iconMapping.entertainment;
    if (activeTags.some(t => ["townhall", "police", "fire_station", "social_facility", "garden_centre"].includes(t))) return iconMapping.government;
    if (activeTags.some(t => ["information", "post_office"].includes(t))) return iconMapping.information;
    if (activeTags.some(t => ["recycling"].includes(t))) return iconMapping.recycling;
    if (activeTags.some(t => ["funeral_directors"].includes(t))) return iconMapping.funeral;
    if (activeTags.some(t => ["shelter"].includes(t))) return iconMapping.shelter;
    if (activeTags.some(t => ["toilets"].includes(t))) return iconMapping.toilet;
    if (activeTags.some(t => ["lottery"].includes(t))) return iconMapping.lottery;
    if (activeTags.some(t => ["internet_cafe"].includes(t))) return iconMapping.computer;

    // Default fallback if no match is found
    return communityIcon;
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

        // NEW COMPONENT: Makes the Map rotatable
        rotate={true}          
        rotateControl={false}   

        // NEW COMPONENT: Add mobile rotation and zoom
        touchRotate={true}    // NEW
        touchZoom={true} 
        >
        <ChangeView center={center} zoom={mapZoom} />
        <RotationController bearing={bearing} />
        {/* Stadia Maps — alidade_smooth_dark theme */}
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
          // url={`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_STADIA_API_KEY}`}
          url={`https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_STADIA_API_KEY}`}
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
             <Popup autoPan={false}>
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
       {staticLocations
          .filter(pin => {
              if (activeTag === "All") return true;
              const allowedTags = TAG_GROUPS[activeTag]?.tags || [];
              return (pin.tags || []).some(tag => allowedTags.includes(tag));
          })
          .filter(shouldShowMarker)
          .filter(facility => {
            const lat = parseFloat(facility.latitude);
            const lng = parseFloat(facility.longitude);
            if (isNaN(lat) || isNaN(lng)) {
              return false;
            }
            return true;
          })
          .map((facility) => (
          <Marker
            key={facility.id}
            position={[parseFloat(facility.latitude), parseFloat(facility.longitude)]}
            icon={getFacilityIcon(facility.tags)}
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
      
      {reviewModal && 
        <div className="review-modal">
          <div className="review-modal-container">
            <Heading className="py-small"><em className='fw-bold'>Leave a Review</em></Heading>      
            <div className='flex gap-small justify-around py-medium px-xlarge'>
                {[1,2,3,4,5].map(n => (
                    <Icon
                        key={n}
                        name={reviewRating >= n ? 'star' : 'darkstar'}
                        size='large'
                        className='cursor-pointer's
                        onClick={() => setReviewRating(n)}
                    />
                ))}
            </div>
          <textarea
              className='p-small border-rounded bg-component '
              style={{ width: '100%', border: 'none', background: 'white', fontFamily: 'inherit', fontSize: 'var(--fs-text)', resize: 'none', minHeight: '60px' }}
              placeholder='Write your comment...'
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
          />
          <div className="flex justify-end my-small gap-medium">
            <Text className="flex items-center cursor-pointer" onClick={() => setReviewModal(false)}><em className="fw-bold">Cancel</em></Text>
            <Button
                onClick={handleSubmitReview}
                disabled={reviewRating === 0 || submittingReview}
            >
                {submittingReview ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>
      }


      {selectedMarkerInfo && (
        <div className="marker-info p-large" ref={panelRef}>

          {/* Drag handle */}
          <div
            className="drag-handle"
            onMouseDown={onDragStart}
            onMouseMove={onDragMove}
            onMouseUp={onDragEnd}
            onTouchStart={onDragStart}
            onTouchMove={onDragMove}
            onTouchEnd={onDragEnd}
          />

          {/* Name + close */}
          
          <div className="flex justify-between gap-xlarge my-small">
            <Heading><strong>{selectedMarkerInfo.name}</strong></Heading>
            <Icon name="close" size="small" className="cursor-pointer" onClick={() => { setSelectedMarkerInfo(null); navigate("/map")}} />
          </div>

          <div className="flex gap-small">
            {/* Get Directions & Save Buttons*/}
            <div className="my-small">
              <Button onClick={() => handleGetDirections(selectedMarkerInfo)}>
                <Icon name="direction" size="small" />
                <Caption>{isLoadingRoute ? "Loading..." : "Get Directions"}</Caption>
              </Button>
            </div>
            
            {user && (
                <div className="my-small">
                  <Button toggled={isSaved} onClick={toggleSaveButton} disabled={isSavingPin} className="items-center gap-small">
                    <Icon name="save" size="small" />
                    <Caption>{isSavingPin ? "Saving..." : isSaved ? "Saved" : "Save"}</Caption>
                  </Button>
                </div>
            )}
            {user && (
                <div className="flex items-center my-small fw-bold gap-small cursor-pointer" onClick={() => setReviewModal(true)}>
                    <Icon name="darkstar" size="small" />
                    <Caption>Rate</Caption>
                </div>
            )}
          </div>
          {routeInfo && (
            <div className="flex items-center gap-medium my-xsmall">
              <Caption className="text-muted">🚗 {routeInfo.distance}</Caption>
              <Caption className="text-muted">⏱ {routeInfo.duration}</Caption>
              <Caption className="text-accent cursor-pointer" onClick={handleClearRoute}>Clear</Caption>
            </div>
          )}

          {/* Tabs — use <button> not <Text/<p> so onClick always fires */}
          <div className="flex gap-large my-small" style={{borderBottom:"1px solid var(--color-component-bg)", paddingBottom:"8px"}}>
            {["About", "Photos", "Reviews"].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedPanelTab(tab)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "var(--fs-text)",
                  fontWeight: selectedPanelTab === tab ? "var(--fw-bold)" : "var(--fw-regular)",
                  color: selectedPanelTab === tab ? "var(--color-accent-primary)" : "var(--color-text-muted)",
                  borderBottom: selectedPanelTab === tab ? "2px solid var(--color-accent-primary)" : "2px solid transparent",
                  paddingBottom: "4px",
                }}
              >{tab}</button>
            ))}
          </div>

          {/* ABOUT */}
          {selectedPanelTab === "About" && (
            <div className="panel-scroll">
              <div className="flex items-center gap-small my-xsmall">
                <Icon name="star" size="small" />
                <Text>
                  {avgRating ? avgRating : "No ratings yet"}
                  {avgRating && <em className="text-muted"> ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</em>}
                </Text>
              </div>
              <div className="flex items-center gap-small my-xsmall">
                <Icon name="address" size="small" /><Text>{selectedMarkerInfo.address || "—"}</Text>
              </div>
              {selectedMarkerInfo.opening_hours?.length > 0 && (
                <div className="flex items-center gap-small my-xsmall">
                  <Icon name="clock" size="small" /><Text>{selectedMarkerInfo.opening_hours[0]}</Text>
                </div>
              )}
              {selectedMarkerInfo.tags?.length > 0 && (
                <div className="flex gap-small my-small" style={{flexWrap:"wrap"}}>
                  {selectedMarkerInfo.tags.map((tag, i) => <Tag key={i}>{tag}</Tag>)}
                </div>
              )}
              {selectedMarkerInfo.additional_info?.text_based?.map((info, i) => (
                <Text key={i} className="text-muted my-xsmall">{info}</Text>
              ))}
              {selectedMarkerInfo.contact_info?.map((info, i) => {
                if (typeof info !== "string") return null;
                if (info.toLowerCase().startsWith("email:"))
                  return <div key={i} className="flex items-center gap-small my-xsmall"><Icon name="mail" size="small"/><Text><em className="text-muted">{info.replace("email:", "").replace("Email:", "").trim()}</em></Text></div>;
                if (info.toLowerCase().startsWith("phone:"))
                  return <div key={i} className="flex items-center gap-small my-xsmall"><Icon name="phone" size="small"/><Text><em className="text-muted">{info.replace("phone:", "").replace("Phone:", "").trim()}</em></Text></div>;
                return null;
              })}
            </div>
          )}

          {/* PHOTOS */}
          {selectedPanelTab === "Photos" && (
            <div className="panel-scroll">
              {selectedMarkerInfo.images?.length > 0 ? (
                <div className="flex gap-medium overflow-x py-small">
                  {selectedMarkerInfo.images.map((img, i) => (
                    <img key={i} src={img} className="border-rounded" style={{width:"260px", height:"180px", objectFit:"cover", flexShrink:0}} />
                  ))}
                </div>
              ) : (
                <Text className="text-muted my-small">No photos available.</Text>
              )}
            </div>
          )}

          {/* REVIEWS */}
          {selectedPanelTab === "Reviews" && (
            <div className="panel-scroll">
              {reviews.length === 0 ? (
                <Text className="text-muted my-small">No reviews yet.</Text>
              ) : (
                reviews.map(r => (
                  <div key={r.id} className="review-item my-small p-medium border-rounded bg-component">
                    <div className="flex justify-between items-center">
                      <Text><em className="fw-bold">{r.userName}</em></Text>
                      <div className="flex gap-xsmall">
                        {[1,2,3,4,5].map(n => (
                          <Icon key={n} name={r.rating >= n ? "star" : "darkstar"} size="small" />
                        ))}
                      </div>
                    </div>
                    {r.comment && <Text className="text-muted">{r.comment}</Text>}
                    <Caption className="text-muted">{new Date(r.created_at).toLocaleDateString()}</Caption>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
};

