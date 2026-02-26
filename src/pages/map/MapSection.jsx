import './MapSection.css'

import searchIcon from '../../assets/images/icon/search-icon.png'
import homeIcon from '../../assets/images/icon/home-icon.png'
import mapIcon from '../../assets/images/icon/map-pin-icon.png'
import accountIcon from '../../assets/images/icon/user-icon.png';
import compassIcon from '../../assets/images/icon/compass-icon.png';
import backIcon from '../../assets/images/icon/back-icon.png';
import closeIcon from '../../assets/images/icon/close-icon.png';
import nextIcon from '../../assets/images/icon/next-icon.png';

import campusServicesData from '../../assets/json/campus-facilities.json';
import communityServicesData from '../../assets/json/miagao-facilities.json';
import { act, useState, useEffect, useRef } from 'react';

import { getCurrentUser, addPinnedLocationToDB } from '../../services/firebase/firebase.js';

import React from "react";
import MapView from "../../components/map/MapView.jsx";

function MapSection({setAppSection, service, setAppService}) {   
    /* Search Location Logic */
    const [searchQuery, setSearchQuery] = useState((service)? service.name : "");
    const [activeSearch, setSearchActive] = useState(false);
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value.toLowerCase().trim()); 
    }

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
    // const [mapCenter, setMapCenter] = useState({ lat: 10.641944, lng: 122.235556 });

    // Default center coordinates (used for initialization and recentering)
    const defaultCenter = { lat: 10.641944, lng: 122.235556 };
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    
    // Tracks the user's latest GPS coordinates
    const [userCurrentLocation, setUserCurrentLocation] = useState(null); 
    
    // NEW STATE: Controls whether the map should automatically pan to the user's location
    const [trackingEnabled, setTrackingEnabled] = useState(false); 

    // Ref to hold the watchPosition ID so we can clear it later
    const watchIdRef = useRef(null);

    // NEW useEffect: Start continuous tracking on mount
    useEffect(() => {
        if ("geolocation" in navigator) {
            // Function to handle location update
            const successHandler = (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setUserCurrentLocation(location);
                
                // If tracking is enabled, update the mapCenter state immediately
                if (trackingEnabled) {
                    setMapCenter(location);
                }
            };
            
            const errorHandler = (error) => {
                console.error("Error getting user location:", error);
            };

            // Start continuous watching and store the ID in the ref
            watchIdRef.current = navigator.geolocation.watchPosition(
                successHandler,
                errorHandler,
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            console.log("Geolocation is not supported by this browser.");
        }

        // Cleanup function: Stops watching when the component unmounts
        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [trackingEnabled]);

    // REVISED: Function to toggle tracking (Recenter Button)
    const handleRecenter = () => {
        // Toggle tracking state
        const newTrackingState = !trackingEnabled;
        setTrackingEnabled(newTrackingState);

        if (newTrackingState && userCurrentLocation) {
            // If turning tracking ON, immediately center the map on the user's last known location
            setMapCenter(userCurrentLocation);
        } else if (!userCurrentLocation) {
             alert("User location is not available.");
             setTrackingEnabled(false);
        }
    };

    // NEW FUNCTION: Centralized way to close the form and clear temporary state
    const handleCloseCreatePin = () => {
        setShowCreatePin(false);
        setPinLatitude(null);
        setPinLongitude(null);
    };

    // REVISED: Function to handle map click or button click for pin creation
    const handleOpenCreatePin = (coords = null) => {
        if (!getCurrentUser()) {
            return;
        }
        
        // Clear previous data
        setPinName("");
        setPinAddress("");
        setPinDescription("");

        if (coords) {
            // Map click: Pre-fill coordinates from the event
            setPinLatitude(coords.lat);
            setPinLongitude(coords.lng);
        } else {
            // Button click: Coordinates are null, user must input manually
            setPinLatitude(null);
            setPinLongitude(null);
        }
        
        setShowCreatePin(true);
    };

    // const handleOpenCreatePin = () => {
    //     if (!getCurrentUser()) {
    //     alert("Please log in to add pins.");
    //     return;
    //     }
    //     setShowCreatePin(true);
    // };
    const handleAddPinnedLocation = async () => {
        const user = getCurrentUser();
        if (!user) return;

        try {
            await addPinnedLocationToDB(
                user.uid,
                pinName || "Untitled Pin",
                pinAddress || "N/A",
                Number(pinLatitude),
                Number(pinLongitude),
                pinDescription
            );

            // Reset
            setShowCreatePin(false);
            setPinName("");
            setPinAddress("");
            setPinDescription("");

            alert("Pin created!");
        } catch (err) {
            alert(err.message);
        }
    };

    // NEW: Function to handle centering to a clicked pin
    const handleCenterToPin = (lat, lng, zoomLevel = 17) => {
        // Stop continuous tracking if a pin is manually centered
        setTrackingEnabled(false); 
        setMapCenter({ lat, lng, zoom: zoomLevel }); 
        // We update mapCenter, but MapView needs to interpret the zoom change.
        // We will adjust MapView's useEffect to handle an optional zoom prop.
    };

    /* Services Data */
    const services = [...campusServicesData, ...communityServicesData]
    const filteredServices = services.filter(service => {
        const nameLower = service.name.toLowerCase();    
        const matchesSearch = nameLower.includes(searchQuery);
        return matchesSearch ;
    });


    /* Set Location */    
    // const userLocation = { lat: 10.641944, lng: 122.235556 };   // default location 
    // if (service) {
    //     [userLocation.lat, userLocation.lng] = service.reformat_coords   // selected service/location
    // } 

    return (
        <div className="MapSection">
            <header className = {(activeSearch) ? "active-search-layout" : "inactive-search-layout"}>
                { (activeSearch) ? <img src={backIcon} onClick={() => {
                        setSearchActive(false); 
                        setSearchQuery(""); 
                        setAppService(null); 
                    }} className="close-search-btn btn"></img> : null 
                }              
                <section className='search-container'>
                    <img src={searchIcon} className="icon"></img>
                    <input  
                        value= {searchQuery}
                        className='search-bar' 
                        placeholder='Search for Services'
                        onChange={handleSearchChange}
                        onFocus={() => {setSearchActive(true); setSearchQuery("")}}
                    />
                </section>  
            </header>

            <section className= { (activeSearch) ? 'search-list-section' : 'search-list-section hidden' }>
                <section className='service-list' key={searchQuery}>
                {
                    filteredServices.map((service, index) => (
                        <div key={index} className='service-btn btn' onClick={() => chooseService(service)}>
                            <img src={mapIcon}></img>
                            <div>
                                <h2 className='title'>{service.name}</h2>
                                <h3 className='tag'>{service.tags.join(", ")}</h3>
                            </div>
                        </div>
                    ))
                }
                </section>
            </section>

            {/* <section className="map">
                <div className = "map-container">
                    <MapView userLocation={userLocation} selectedService={service} onCenterChange={(lat, lng) => setMapCenter({ lat, lng })}/>
                </div>
            </section> */}
            <section className="map">
                <div className = "map-container">
                    <MapView 
                        userLocation={mapCenter} 
                        currentCoords={userCurrentLocation}
                        trackingEnabled={trackingEnabled}
                        selectedService={service} 
                        // NEW PROP: Pass the function to open the pin form with coordinates
                        onMapClickForPin={handleOpenCreatePin} 
                        onClosePinForm={handleCloseCreatePin}
                        onMarkerClick={handleCenterToPin}
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

                        {/* <div className="coordinates-inputs">
                            <input
                                className="info-input"
                                placeholder="Latitude"
                                value={pinLatitude || ""}
                                onChange={(e) => setPinLatitude(parseFloat(e.target.value))}
                            />
                            <input
                                className="info-input"
                                placeholder="Longitude"
                                value={pinLongitude || ""}
                                onChange={(e) => setPinLongitude(parseFloat(e.target.value))}
                            />
                        </div> */}
                        <div className="coordinates-inputs">
                            {/* Display pre-filled coordinates as read-only or allow editing */}
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
            </section>
                    
            <footer>
                <nav>
                    <ul>
                        <li className='navigation btn' onClick={ () => { setAppSection("HOME") ; setAppService(null)} }>
                            <img className='icon' src={homeIcon}></img>
                            <p className='label'>Service</p>    
                        </li>
                        <li className='navigation active btn' onClick={ () => setAppSection("MAP") }>
                            <img className='icon' src={mapIcon}></img>
                            <p className='label'>Map</p>    
                        </li>
                        <li className='navigation btn' onClick={ () => getCurrentUser() ? (setAppSection("ACCOUNT"), setAppService(null)) : (setAppSection("LOGIN"), setAppService(null))}>
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