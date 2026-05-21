// Important Dependencies
import React, { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline} from "react-leaflet";
import { useParams, useNavigate } from "react-router-dom";
import { TAG_GROUPS } from './../../../utils/servicecoding.js'

import "leaflet/dist/leaflet.css";
import L, { map, marker } from "leaflet";
import "./MapView.css";
import "leaflet-rotate";

import { Link } from 'react-router-dom';
import { Button } from '../../../components/form';
import { Icon, Carousel, Tag } from './../../../components/ui';
import { Text, Caption, Heading, Subtitle } from './../../../components/typography'

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
import { onAuthStateChangedListener, getPinnedLocationsFromDB, supabase, getCurrentUser } from "../../../services/supabase.js";
import { getLocationReviews, submitLocationReview, getLocationReviewOfUser, deleteLocationReview} from "../../../services/reviewsService.js";
import { hasServiceCache, getAllServicesFromCache, fetchServicesFromServer, getServiceFromCache } from '../../../services/service-handler.js';


// fixes icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom icon for the user's location
const userIcon = new L.Icon({
    iconUrl: userPinIcon,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
    className: 'user-location-marker' 
});

const restaurantIcon = new L.Icon({ iconUrl: restaurantPinIcon, iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const cafeIcon       = new L.Icon({ iconUrl: cafePinIcon,        iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const bakeryIcon     = new L.Icon({ iconUrl: bakeryPinIcon,      iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const groceryIcon    = new L.Icon({ iconUrl: groceryPinIcon,     iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const giftIcon       = new L.Icon({ iconUrl: giftPinIcon,        iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const hardwareIcon   = new L.Icon({ iconUrl: hardwarePinIcon,    iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const printingIcon   = new L.Icon({ iconUrl: printingPinIcon,    iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const beautyIcon     = new L.Icon({ iconUrl: beautyPinIcon,      iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const medicalIcon    = new L.Icon({ iconUrl: medicalPinIcon,     iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const pharmacyIcon   = new L.Icon({ iconUrl: pharmacyPinIcon,    iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const financialIcon  = new L.Icon({ iconUrl: financialPinIcon,   iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const universityIcon = new L.Icon({ iconUrl: universityPinIcon,  iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const schoolsIcon    = new L.Icon({ iconUrl: schoolsPinIcon,     iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const accommodationIcon = new L.Icon({ iconUrl: accommodationPinIcon, iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const automotiveIcon = new L.Icon({ iconUrl: automotivePinIcon,  iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const laundryIcon    = new L.Icon({ iconUrl: laundryPinIcon,     iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const tourismIcon    = new L.Icon({ iconUrl: tourismPinIcon,     iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const religiousIcon  = new L.Icon({ iconUrl: religiousPinIcon,   iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const entertainmentIcon = new L.Icon({ iconUrl: entertainmentPinIcon, iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const governmentIcon = new L.Icon({ iconUrl: governmentPinIcon,  iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const informationIcon = new L.Icon({ iconUrl: informationPinIcon, iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const recyclingIcon  = new L.Icon({ iconUrl: recyclingPinIcon,   iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const funeralIcon    = new L.Icon({ iconUrl: funeralPinIcon,     iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const shelterIcon    = new L.Icon({ iconUrl: shelterPinIcon,     iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const toiletIcon     = new L.Icon({ iconUrl: toiletPinIcon,      iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const lotteryIcon    = new L.Icon({ iconUrl: lotteryPinIcon,     iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const computerIcon   = new L.Icon({ iconUrl: computerPinIcon,    iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const communityIcon  = new L.Icon({ iconUrl: communityPinIcon,   iconSize: [30, 30], iconAnchor: [15, 15], className: 'user-location-marker' });
const customIcon     = new L.Icon({ iconUrl: customPinIcon,      iconSize: [40, 40], iconAnchor: [20, 20], className: 'user-location-marker' });

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
  community: communityIcon
};

// REVISED: Component to handle map clicks and open the pin form
function LocationMarker({ tempLocation, setTempLocation, setSelectedMarkerInfo, onMapClickForPin, onClosePinForm, handleMarkerClick }) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
        
      if (tempLocation) {
        // RULE 1: If a temporary pin exists, remove it and close the form.
        setTempLocation(null);
        setSelectedMarkerInfo(null);
        onClosePinForm();
      } else {
        // RULE 2: If no temporary pin exists, create one and open the form.
        const newPin = {
            latitude: lat,
            longitude: lng,
            name: "Temporary Pin",
            type: "Temporary Pin",
            tags: ["Temporary Pin"],
            address: `${lat}, ${lng}`,
        };
        handleMarkerClick(newPin, newPin.latitude, newPin.longitude);
        setTempLocation(newPin); 
        setSelectedMarkerInfo(null);
        onMapClickForPin({ lat, lng });
      }
    },
  });

  return null;
}

function getScaledIcon(baseIcon, scale = 1, desaturated = false) {
  const size = 30 * scale;
  const anchor = size / 2;
  return new L.Icon({
    iconUrl: baseIcon.options.iconUrl,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    className: `user-location-marker${desaturated ? ' marker-desaturated' : ''}`
  });
}

// FIX 2: Responds to location change, preserves zoom when not explicitly changed
function ChangeView({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(center);
  const prevZoom = useRef(zoom);

  useEffect(() => {
    const tolerance = 0.000001; 
    const isDifferentCenter = !center || 
                        Math.abs(prevCenter.current[0] - center[0]) > tolerance || 
                        Math.abs(prevCenter.current[1] - center[1]) > tolerance;
    
    const isDifferentZoom = zoom !== undefined && Math.abs(prevZoom.current - zoom) > 0;
    
    if (center && (isDifferentCenter || isDifferentZoom)) {
      const targetZoom = zoom || map.getZoom();
      const offsetPx = window.innerHeight * 0.275;
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

// Displays the user's marker and handles the view tracking
function UserLocationMarker({ coords, trackingEnabled }) {
    const map = useMap();
    const markerRef = useRef(null);

    useEffect(() => {
        if (trackingEnabled && coords) {
            map.setView([coords.lat, coords.lng], map.getZoom(), {
                animate: true,
                duration: 0.5
            });
        }
    }, [coords, trackingEnabled, map]);

    if (!coords) return null;

    const position = [coords.lat, coords.lng];

    return (
        <Marker 
            position={position}
            icon={userIcon}
            ref={markerRef}
            zIndexOffset={10} 
        >
            <Popup autoPan={false}>
                You are here.
                {trackingEnabled && <span className="tracking-badge"> (Tracking ON)</span>}
            </Popup>
        </Marker>
    );
}

// Controls the Map rotation
function RotationController({ bearing }) {
  const map = useMap();

  useEffect(() => {
    if (map.setBearing) {
      map.setBearing(bearing);
    }
  }, [bearing, map]);

  return null;
}

// Captures the live Leaflet map instance so we can read its current zoom
function MapInstanceCapture({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

// main map element
export function MapView({ userLocation, currentCoords, trackingEnabled, selectedService, onMapClickForPin, onClosePinForm, onMarkerClick, bearing, onBearingChange, onRouteNeeded, setRatingSession, isRating, setRating, activeTag}) {
  const navigate = useNavigate();

  const defaultCenter = [10.641944, 122.235556];
  const [center, setCenter] = useState(defaultCenter);
  const [loading, setLoading] = useState(true);
  const [pinnedLocations, setPinnedLocations] = useState([]);
  const [staticLocations, setStaticLocations] = useState([]);
  const [selectedMarkerInfo, setSelectedMarkerInfo] = useState(selectedService);
  const [selectedPanelTab, setSelectedPanelTab] = useState("About");
  const [tempLocation, setTempLocation] = useState(null);

  // FIX 2: ref to read live map zoom without forcing re-renders
  const mapRef = useRef(null);

  // States for PostGIS directions using Leaflet
  const [routeCoords, setRouteCoords] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeDestination, setRouteDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

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
  const [savedComment, setSavedComment] = useState('');
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
  }, [authLoading, id, user]);

  useEffect(() => {
      if (reviewModal === false) {
          setReviewRating(savedRating);
      }
  }, [reviewModal, savedRating]);

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

  async function handleClearReview() {
    if (!user || !id) return;
    setSubmittingReview(true);
    try {
        await deleteLocationReview(Number(id), user.id);
        setSavedComment("");
        setReviewComment("");
        setSavedRating(0);
        setReviewRating(0);
        const updated = await getLocationReviews(Number(id));
        setReviews(updated);
        setReviewModal(false);
    } catch (e) {
        console.error('Failed to remove review:', e);
    } finally {
        setSubmittingReview(false);
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const mapZoom = userLocation?.zoom || 16;

  // Bottom-sheet drag state for the marker info panel
  const dragY = useRef(0);
  const startY = useRef(null);
  const isDraggingPanel = useRef(false);
  const panelRef = useRef(null);

  function onDragStart(e) {
      startY.current = e.clientY;
      isDraggingPanel.current = true;
      dragY.current = 0;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      if (panelRef.current) {
          panelRef.current.style.transition = 'none';
      }
  }

  function onDragMove(e) {
      if (!isDraggingPanel.current || startY.current === null || !panelRef.current) return;
      const delta = Math.max(0, e.clientY - startY.current);
      dragY.current = delta;
      panelRef.current.style.transform = `translateY(${delta}px)`;
  }

  function onDragEnd(e) {
      if (!isDraggingPanel.current || !panelRef.current) return;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      panelRef.current.style.transition = 'transform 0.25s ease';
      if (dragY.current > 140) {
          panelRef.current.style.transform = 'translateY(100%)';
          setTimeout(() => {
              setSelectedMarkerInfo(null);
              navigate('/map');
          }, 200);
      } else {
          panelRef.current.style.transform = 'translateY(0)';
      }
      dragY.current = 0;
      startY.current = null;
      isDraggingPanel.current = false;
  }

  // FIX 2: Read live zoom from mapRef instead of hardcoding 17
  const handleMarkerClick = (data, lat, lng, shouldRoute = false) => {
      setSelectedMarkerInfo(data);
      setTempLocation(null);
      onClosePinForm();

      if (onMarkerClick) {
          // Use the map's current zoom level — don't force a jump to 17
          const currentZoom = mapRef.current ? mapRef.current.getZoom() : mapZoom;
          console.log(currentZoom)
          onMarkerClick(lat, lng, currentZoom);
          navigate(`/map/${data.id ? data.id : ""}`);
      }
      
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
  };

  useEffect(() => {
    if (!id) return;

    const personalPin = pinnedLocations.find((pin) => String(pin.id) === String(id));
    if (personalPin) {
      handleMarkerClick(
        personalPin,
        parseFloat(personalPin.latitude),
        parseFloat(personalPin.longitude)
      );
      return;
    }

    const staticLocation = staticLocations.find((location) => String(location.id) === String(id));
    if (staticLocation) {
      handleMarkerClick(
        { ...staticLocation, type: staticLocation.location_type },
        parseFloat(staticLocation.latitude),
        parseFloat(staticLocation.longitude)
      );
    }
  }, [id, pinnedLocations, staticLocations]);

  useEffect(() => {
      handleServiceClick(selectedService);
  }, [selectedService]);

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

  // FIX 1: Cache static locations in sessionStorage to avoid re-fetching on every refresh
  useEffect(() => {
    const fetchStaticLocations = async () => {
      const CACHE_KEY = 'static_locations_cache';
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        setStaticLocations(JSON.parse(cached));
        setLoading(false);
        return;
      }
      const data = await getStaticLocations(supabase);
      const valid = data.filter(r => !isNaN(parseFloat(r.latitude)) && !isNaN(parseFloat(r.longitude)));
      console.log(`🗺 Total loaded: ${data.length} | Valid coords: ${valid.length} | Skipped: ${data.length - valid.length}`);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      setStaticLocations(data);
    };
    fetchStaticLocations();
  }, []);

  const shouldShowMarker = (facility) => {
    return true;
  };

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

      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== "Ok") {
        console.warn("OSRM routing failed:", data.message);
        return;
      }

      const route = data.routes[0];
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

  const handleClearRoute = () => {
    setRouteCoords([]);
    setRouteDestination(null);
    setRouteInfo(null);
  };

  const getFacilityIcon = (tags) => {
    if (!tags) return communityIcon;
    
    let parsedTags = [];
    try {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch (e) {
      console.error("Failed to parse facility tags JSON array", e);
      return communityIcon;
    }

    if (!Array.isArray(parsedTags)) return communityIcon;

    const activeTags = parsedTags.map(t => String(t).toLowerCase());

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

    return communityIcon;
  };

  // FIX 3: Memoize allowed tag set — O(1) Set lookup instead of O(n) Array.includes
  const allowedTagSet = useMemo(() => {
    if (activeTag === 'All') return null; // null = show all, skip tag checks entirely
    const tags = TAG_GROUPS[activeTag]?.tags || [];
    return new Set(tags);
  }, [activeTag]);

  // FIX 3: Pre-filter both location lists once per activeTag change, not on every render
  const visibleStaticLocations = useMemo(() => {
    return staticLocations.filter(location => {
      if (allowedTagSet === null) return true;
      const tags = Array.isArray(location.tags)
        ? location.tags.map(t => String(t).toLowerCase())
        : [];
      return tags.some(t => allowedTagSet.has(t));
    });
  }, [staticLocations, allowedTagSet]);

  const visiblePinnedLocations = useMemo(() => {
    return pinnedLocations.filter(location => {
      if (allowedTagSet === null) return true;
      const tags = Array.isArray(location.tags)
        ? location.tags.map(t => String(t).toLowerCase())
        : [];
      return tags.some(t => allowedTagSet.has(t));
    });
  }, [pinnedLocations, allowedTagSet]);

  return (
    <div className="MapView">
      <MapContainer 
        center={center} 
        zoom={mapZoom} 
        style={{ width: "100%", height: "100%", zIndex: 0}} 
        zoomControl={false}
        minZoom={13}
        maxZoom={20}
        maxBounds={[
          [10.55, 122.10],
          [10.78, 122.35],
        ]}
        maxBoundsViscosity={1.0}
        rotate={true}          
        rotateControl={false}   
        touchRotate={true}
        touchZoom={true} 
      >
        {/* FIX 2: Capture the live map instance so handleMarkerClick can read current zoom */}
        <MapInstanceCapture mapRef={mapRef} />
        <ChangeView center={center} zoom={mapZoom} />
        <RotationController bearing={bearing} />
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
          url={`https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_STADIA_API_KEY}`}
          minZoom={13}
          maxZoom={20}
        />
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
            icon={getScaledIcon(customIcon, 1.75)} 
            position={[tempLocation.latitude, tempLocation.longitude]} 
            eventHandlers={{ click: () => handleMarkerClick(tempLocation, tempLocation.latitude, tempLocation.longitude) }}
          >
            <Popup autoPan={false}>
              Clicked Location: <br />
              Lat: {tempLocation.latitude}, <br />
              Lng: {tempLocation.longitude}
            </Popup>
          </Marker>
        )}

        {/* FIX: Added missing return statement so pinned markers actually render */}
        {visiblePinnedLocations.map((pin) => {
          const isSelected = selectedMarkerInfo?.id === pin.id;
          const icon = getScaledIcon(customIcon, isSelected ? 1.5 : 1, !isSelected && !!selectedMarkerInfo);
          return (
            <Marker
              key={pin.id}
              position={[pin.latitude, pin.longitude]}
              icon={icon}
              eventHandlers={{ click: () => handleMarkerClick(pin, pin.latitude, pin.longitude) }}
            />
          );
        })}

        {/* FIX 3: Use pre-filtered visibleStaticLocations instead of filtering inline */}
        {visibleStaticLocations
          .filter(shouldShowMarker)
          .filter(facility => {
            const lat = parseFloat(facility.latitude);
            const lng = parseFloat(facility.longitude);
            return !isNaN(lat) && !isNaN(lng);
          })
          .map((facility) => {
            const isSelected = selectedMarkerInfo?.id === facility.id;
            const baseIcon = getFacilityIcon(facility.tags);
            const icon = getScaledIcon(baseIcon, isSelected ? 1.5 : 1, !isSelected && !!selectedMarkerInfo);

            return (
              <Marker
                key={facility.id}
                position={[parseFloat(facility.latitude), parseFloat(facility.longitude)]}
                icon={icon}
                eventHandlers={{ click: () => {
                  handleMarkerClick(
                    { ...facility, type: facility.location_type },
                    parseFloat(facility.latitude),
                    parseFloat(facility.longitude)
                  );
                }}}
              />
            );
          })
        } 
      </MapContainer>
      
      {reviewModal && (
        <div className='modal-container flex justify-center items-center px-xlarge'>
          <div className='w-100 flex flex-col justify-center mx-medium p-large bg-white border-roundify'>
            <div className='flex justify-between items-center'>
              <Heading className='fw-extra-bold py-xsmall'>Leave a Review</Heading>
              <Icon
                className='flex items-center cursor-pointer'
                name='close'
                size='small'
                onClick={() => { setReviewModal(false); setReviewRating(savedRating); setReviewComment(savedComment); }}
              />
            </div>
            <div className='flex justify-center my-medium gap-large'>
              {[1, 2, 3, 4, 5].map((number) => (
                <Icon
                  key={number}
                  name={number <= reviewRating ? "star" : "lightstar"}
                  onClick={() => setReviewRating(number)}
                  size='large'
                  className='cursor-pointer'
                />
              ))}
            </div>
            <div className='px-small'>
              <textarea
                disabled={submittingReview}
                value={reviewComment}
                className='w-100 bg-component border-none border-roundify p-medium'
                placeholder='Comment (Optional)'
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>
            <div className='py-small flex justify-end gap-small'>
              <Button disabled={submittingReview} onClick={handleClearReview}>Clear Rating</Button>
              <Button disabled={submittingReview} className='border-solid' onClick={handleSubmitReview}>
                {submittingReview ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )} 

      {selectedMarkerInfo && (
        <div className="marker-info py-large px-xlarge" ref={panelRef}>

          {/* Drag handle */}
          <div className="drag-region">
            <div
              className="drag-handle"
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
            />
          </div>

          {/* Name + close */}
          <div className="flex justify-between gap-xlarge my-small px-medium">
            <Subtitle className="fw-extra-bold">{selectedMarkerInfo.name}</Subtitle>
            <Icon name="close" size="small" className="cursor-pointer" onClick={() => { setSelectedMarkerInfo(null); navigate("/map"); }} />
          </div>

          <div className="flex gap-small">
            <div className="m-small">
              <Button onClick={() => handleGetDirections(selectedMarkerInfo)} className="border-solid">
                <Icon name="direction" size="small" />
                <Text>{isLoadingRoute ? "Loading..." : "Get Directions"}</Text>
              </Button>
            </div>
            {user && (
              <div className="flex items-center my-small fw-bold gap-small cursor-pointer" onClick={() => setReviewModal(true)}>
                <Icon name="darkstar" size="small" />
                <Text>Rate</Text>
              </div>
            )}
          </div>
          
          {routeInfo && (
            <div className="flex items-center gap-medium m-small">
              <Caption className="text-muted">🚗 {routeInfo.distance}</Caption>
              <Caption className="text-muted">⏱ {routeInfo.duration}</Caption>
              <Caption className="text-accent cursor-pointer" onClick={handleClearRoute}>Clear</Caption>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-large m-small" style={{borderBottom:"1px solid var(--color-component-bg)", paddingBottom:"8px"}}>
            {["About", "Photos"].map(tab => (
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
            <div className="panel-scroll px-large">
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
            <div className="panel-scroll px-large">
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
        </div>
      )}
    </div>
  );
}