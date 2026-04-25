import './MapSection.css'

import searchIcon from '../../assets/images/icon/search-icon.png'
import homeIcon from '../../assets/images/icon/home-icon.png'
import mapIcon from '../../assets/images/icon/map-pin-icon.png'
import accountIcon from '../../assets/images/icon/user-icon.png';
import compassIcon from '../../assets/images/icon/compass-icon.png';
import backIcon from '../../assets/images/icon/back-icon.png';
import closeIcon from '../../assets/images/icon/close-icon.png';
import nextIcon from '../../assets/images/icon/next-icon.png';

// Removed: campusServicesData and communityServicesData JSON imports
// Services are now fetched from Supabase static_locations table
import { useState, useEffect, useRef } from 'react';

import { getCurrentUser, addPinnedLocationToDB, supabase } from '../../services/supabase.js';

import React from "react";
import MapView from "../../components/map/MapView.jsx";
import CassieWidget from "../../components/cassie/CassieWidget.jsx";

function MapSection({setAppSection, service, setAppService, navigateTo, onNavigateComplete}) {

    /* Search Location Logic */
    const [searchQuery, setSearchQuery] = useState((service) ? service.name : "");
    const [activeSearch, setSearchActive] = useState(false);
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value.toLowerCase().trim());
    }

    // getCurrentUser() is now async — load user into state on mount
    const [user, setUser] = useState(null);
    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    // Replaces campusServicesData + communityServicesData JSON imports
    const [allServices, setAllServices] = useState([]);
    useEffect(() => {
        const fetchServices = async () => {
            const { data, error } = await supabase
                .from("static_locations")
                .select("id, name, tags, address, latitude, longitude, opening_hours, contact_info, services, images, additional_info, location_type");
            if (error) {
                console.error("Error fetching services:", error);
                return;
            }
            setAllServices(data);
        };
        fetchServices();
    }, []);

    /* For user choosing a service */
    function chooseService(service) {
        setAppService(service);
        setAppSection("MAP");
        setSearchQuery((service) ? service.name : "");
        setSearchActive(false);
    }

    /* Show Pin Information Logic */
    const [openMapInfo, setOpenMapInfo] = useState(false);
    const [mapInfoTab, setMapInfoTab] = useState("about");

    /* Create Pin Location Logic */
    const [showCreatePin, setShowCreatePin] = useState(false);
    const [pinName, setPinName] = useState("");
    const [pinAddress, setPinAddress] = useState("");
    const [pinDescription, setPinDescription] = useState("");
    const [pinLatitude, setPinLatitude] = useState(null);
    const [pinLongitude, setPinLongitude] = useState(null);

    // Default center coordinates (used for initialization and recentering)
    const defaultCenter = { lat: 10.641944, lng: 122.235556 };
    const [mapCenter, setMapCenter] = useState(defaultCenter);

    // Tracks the user's latest GPS coordinates
    const [userCurrentLocation, setUserCurrentLocation] = useState(null);

    // Controls whether the map should automatically pan to the user's location
    const [trackingEnabled, setTrackingEnabled] = useState(false);

    // Ref to hold the watchPosition ID so we can clear it later
    const watchIdRef = useRef(null);

    // For Map Rotation
    const [mapBearing, setMapBearing] = useState(0);
    const rotateIntervalRef = useRef(null);

    // Start continuous GPS tracking on mount
    useEffect(() => {
        if ("geolocation" in navigator) {
            const successHandler = (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setUserCurrentLocation(location);

                if (trackingEnabled) {
                    setMapCenter(location);
                }
            };

            const errorHandler = (error) => {
                console.error("Error getting user location:", error);
            };

            watchIdRef.current = navigator.geolocation.watchPosition(
                successHandler,
                errorHandler,
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            console.log("Geolocation is not supported by this browser.");
        }

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [trackingEnabled]);

    // Toggle GPS tracking (Recenter Button)
    const handleRecenter = () => {
        const newTrackingState = !trackingEnabled;
        setTrackingEnabled(newTrackingState);

        if (newTrackingState && userCurrentLocation) {
            setMapCenter(userCurrentLocation);
        } else if (!userCurrentLocation) {
            alert("User location is not available.");
            setTrackingEnabled(false);
        }
    };

    // Close the create-pin form and clear temporary state
    const handleCloseCreatePin = () => {
        setShowCreatePin(false);
        setPinLatitude(null);
        setPinLongitude(null);
    };

    // Open pin creation form — uses already-resolved user state instead of sync getCurrentUser()
    const handleOpenCreatePin = (coords = null) => {
        if (!user) return;

        setPinName("");
        setPinAddress("");
        setPinDescription("");

        if (coords) {
            setPinLatitude(coords.lat);
            setPinLongitude(coords.lng);
        } else {
            setPinLatitude(null);
            setPinLongitude(null);
        }

        setShowCreatePin(true);
    };

    // Save pin to Supabase user_locations table
    const handleAddPinnedLocation = async () => {
        if (!user) return;

        try {
            await addPinnedLocationToDB(
                user.id, // Supabase uses user.id, not user.uid
                pinName || "Untitled Pin",
                pinAddress || "N/A",
                Number(pinLatitude),
                Number(pinLongitude),
                pinDescription
            );

            setShowCreatePin(false);
            setPinName("");
            setPinAddress("");
            setPinDescription("");

            alert("Pin created!");
        } catch (err) {
            alert(err.message);
        }
    };

    // Center map on a clicked pin
    const handleCenterToPin = (lat, lng, zoomLevel = 17) => {
        setTrackingEnabled(false);
        setMapCenter({ lat, lng, zoom: zoomLevel });
    };

    /* Filter services from Supabase data — replaces [...campusServicesData, ...communityServicesData] */
    const filteredServices = allServices.filter(service => {
        const nameLower = service.name.toLowerCase();
        return nameLower.includes(searchQuery);
    });

    /* Rotation functions */
    const startRotating = (direction) => {
        rotateIntervalRef.current = setInterval(() => {
            setMapBearing(prev => prev + (direction === "left" ? -2 : 2));
        }, 16); // ~60fps
    };

    const stopRotating = () => {
        if (rotateIntervalRef.current) {
            clearInterval(rotateIntervalRef.current);
            rotateIntervalRef.current = null;
        }
    };

    const smoothResetBearing = () => {
        const animationRef = { current: null };

        const animate = () => {
            setMapBearing(prev => {
            // Normalize bearing to -180 to 180 range for shortest path
            let current = prev % 360;
            if (current > 180) current -= 360;
            if (current < -180) current += 360;

            // If close enough to 0, snap to 0 and stop
            if (Math.abs(current) < 0.5) {
                cancelAnimationFrame(animationRef.current);
                return 0;
            }

            // Ease towards 0 — multiply by 0.85 each frame for smooth deceleration
            return current * 0.85;
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    return (
        <div className="MapSection">
            <header className={(activeSearch) ? "active-search-layout" : "inactive-search-layout"}>
                {(activeSearch) ? <img src={backIcon} onClick={() => {
                    setSearchActive(false);
                    setSearchQuery("");
                    setAppService(null);
                }} className="close-search-btn btn"></img> : null}
                <section className='search-container'>
                    <img src={searchIcon} className="icon"></img>
                    <input
                        value={searchQuery}
                        className='search-bar'
                        placeholder='Search for Services'
                        onChange={handleSearchChange}
                        onFocus={() => { setSearchActive(true); setSearchQuery("") }}
                    />
                </section>
            </header>

            <section className={(activeSearch) ? 'search-list-section' : 'search-list-section hidden'}>
                <section className='service-list' key={searchQuery}>
                    {filteredServices.map((service) => (
                        // Supabase rows have a unique id — use that as key instead of array index
                        <div key={service.id} className='service-btn btn' onClick={() => chooseService(service)}>
                            <img src={mapIcon}></img>
                            <div>
                                <h2 className='title'>{service.name}</h2>
                                <h3 className='tag'>{service.tags?.join(", ")}</h3>
                            </div>
                        </div>
                    ))}
                </section>
            </section>

            <section className="map">
                <div className="map-container">
                    <MapView
                        userLocation={mapCenter}
                        currentCoords={userCurrentLocation}
                        trackingEnabled={trackingEnabled}
                        selectedService={service}
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
                        <span className="close-btn" onClick={() => setShowCreatePin(false)}>
                            <img src={closeIcon}></img>
                        </span>
                    </div>

                    <hr className="separator"></hr>

                    <div className="sheet-inputs">
                        <div className="pin-info-form">
                            <input
                                className="info-input"
                                placeholder="Name"
                                value={pinName}
                                onChange={(e) => setPinName(e.target.value)}
                            />
                            <input
                                className="info-input"
                                placeholder="Address"
                                value={pinAddress}
                                onChange={(e) => setPinAddress(e.target.value)}
                            />
                        </div>

                        <div className="coordinates-inputs">
                            <input
                                className="info-input hidden"
                                placeholder="Latitude"
                                value={pinLatitude === null ? "" : pinLatitude}
                                onChange={(e) => setPinLatitude(e.target.value)}
                            />
                            <input
                                className="info-input hidden"
                                placeholder="Longitude"
                                value={pinLongitude === null ? "" : pinLongitude}
                                onChange={(e) => setPinLongitude(e.target.value)}
                            />
                        </div>

                        <div className="description-input">
                            <textarea
                                className="info-input"
                                placeholder="Description"
                                value={pinDescription}
                                onChange={(e) => setPinDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className='confirm-container'>
                        <span className="confirm-pin-btn btn" onClick={() => handleAddPinnedLocation()}>
                            <img src={nextIcon}></img>
                        </span>
                    </div>
                </div>
            )}

            <section className="controls">
                <button
                    className={"current-location-btn " + (trackingEnabled ? "active-tracking" : "")}
                    onClick={handleRecenter}
                >
                    <img className="current-location-img" src={compassIcon}></img>
                </button>
                <CassieWidget 
                    currentSection="MAP" 
                    selectedService={service}
                    userLocation={userCurrentLocation}
                    onNavigateToLocation={(place) => {
                        setAppService(place);
                        handleCenterToPin(parseFloat(place.latitude), parseFloat(place.longitude));
                    }}
                />
            </section>
            <div className="rotation-test-controls">                
                <button
                    className="rotate-btn"
                    onMouseDown={() => startRotating("left")}
                    onMouseUp={stopRotating}
                    onMouseLeave={stopRotating}
                    onTouchStart={() => startRotating("left")}
                    onTouchEnd={stopRotating}
                >↺</button>
                <button
                    className="rotate-btn"
                    onClick={smoothResetBearing}
                >⊙</button>
                <button
                    className="rotate-btn"
                    onMouseDown={() => startRotating("right")}
                    onMouseUp={stopRotating}
                    onMouseLeave={stopRotating}
                    onTouchStart={() => startRotating("right")}
                    onTouchEnd={stopRotating}
                >↻</button>
            </div>
            <footer>
                <nav>
                    <ul>
                        <li className='navigation btn' onClick={() => { setAppSection("HOME"); setAppService(null) }}>
                            <img className='icon' src={homeIcon}></img>
                            <p className='label'>Service</p>
                        </li>
                        <li className='navigation active btn' onClick={() => setAppSection("MAP")}>
                            <img className='icon' src={mapIcon}></img>
                            <p className='label'>Map</p>
                        </li>
                        {/* getCurrentUser() is async — use already-resolved user state */}
                        <li className='navigation btn' onClick={() => {
                            setAppService(null);
                            setAppSection(user ? "ACCOUNT" : "LOGIN");
                        }}>
                            <img className='icon' src={accountIcon}></img>
                            <p className='label'>Account</p>
                        </li>
                    </ul>
                </nav>
            </footer>
        </div>
    );
}

export default MapSection;