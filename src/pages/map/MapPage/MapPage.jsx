import './MapPage.css';
import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Button, CircularButton, InputField, Dropdown } from './../../../components/form/';
import { Caption, Heading, Text, Title } from './../../../components/typography/';
import { Icon, MapView } from './../../../components/ui/';
import { supabase, getCurrentUser } from './../../../services/supabase.js';
import { hasServiceCache, getAllServicesFromCache, fetchServicesFromServer } from '../../../services/service-handler.js';

import Yu from './../../../assets/images/profile/profile.jpg';

export default function MapPage() {
    // TODO: Map recenterings (the compass) requires two presses to recenter (the first tap will recenter, but succeding recenters need two taps :<)
    // check user auth
    const [user, setUser] = useState(null);
    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    // get service id from url
    const { id } = useParams();  

    // fetch service and set all tags and filters
    const [services, setServices] = useState([]);
    useEffect(() => {
        async function loadServices() {
            if (!hasServiceCache()) {
                fetchServicesFromServer();
            } 
            setServices(getAllServicesFromCache());  
        }
        loadServices();
    }, []);
    const SERVICE_TAGS = ['All', ...new Set(services.flatMap(service => service.tags ?? []))];
    const FILTER_OPTIONS = ['Nearest Location', 'Top Rated', 'Open Now'];

    // searching services logic
    const [activeTab, setActiveTab] = useState(SERVICE_TAGS[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setSearching] = useState(false);
    const filteredServices = services.filter((service) => {
        return service.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });


    
    // // map tracking logic 
    // const defaultCenter = { lat: 10.641944, lng: 122.235556 };                  // default coords
    // const [mapCenter, setMapCenter] = useState(defaultCenter);                  
    // const [userCurrentLocation, setUserCurrentLocation] = useState(null);       // user's latest GPS coordinate
    // const watchIdRef = useRef(null);                                            // ref to hold the watchPosition ID so we can clear it later
    // const [trackingEnabled, setTrackingEnabled] = useState(false);              // controls whether the map should automatically pan to the user's location

    // useEffect(() => {
    //     if ("geolocation" in navigator) {
    //         const successHandler = (position) => {
    //             const location = {
    //                 lat: position.coords.latitude,
    //                 lng: position.coords.longitude,
    //             };
    //             setUserCurrentLocation(location);

    //             if (trackingEnabled) {
    //                 setMapCenter(location);
    //             }
    //         };

    //         const errorHandler = (error) => {
    //             console.error("Error getting user location:", error);
    //         };

    //         watchIdRef.current = navigator.geolocation.watchPosition(
    //             successHandler,
    //             errorHandler,
    //             { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    //         );
    //     } else {
    //         console.log("Geolocation is not supported by this browser.");
    //     }

    //     return () => {
    //         if (watchIdRef.current) {
    //             navigator.geolocation.clearWatch(watchIdRef.current);
    //         }
    //     };
    // }, [trackingEnabled]);

    // // map centering logic — also passed to MapView as onMarkerClick
    // function handleCenterToPin(lat, lng, zoomLevel = 17) {
    //     setTrackingEnabled(false);
    //     setMapCenter({ lat, lng, zoom: zoomLevel });
    // };
    
    // // map recenter to user logic
    // function handleRecenter() {
    //     const newTrackingState = !trackingEnabled;
    //     setTrackingEnabled(newTrackingState);

    //     if (newTrackingState && userCurrentLocation) {
    //         console.log(newTrackingState);
    //         setMapCenter(userCurrentLocation);
    //     } else if (!userCurrentLocation) {
    //         alert("User location is not available.");
    //         setTrackingEnabled(false);
    //     }
    // };

    // // pin form state — opened when user taps the map to drop a temp pin
    // const [isPinFormOpen, setIsPinFormOpen] = useState(false);
    // const [pinFormCoords, setPinFormCoords] = useState(null);

    // function handleMapClickForPin({ lat, lng }) {
    //     setPinFormCoords({ lat, lng });
    //     setIsPinFormOpen(true);
    // }

    // function handleClosePinForm() {
    //     setIsPinFormOpen(false);
    //     setPinFormCoords(null);
    // }

    // // map rotation logic
    // const rotateIntervalRef = useRef(null);
    // const [mapBearing, setMapBearing] = useState(0);
    
    // function startRotating(direction) {
    //     rotateIntervalRef.current = setInterval(() => {
    //         setMapBearing(prev => prev + (direction === "left" ? -2 : 2));
    //     }, 16); // ~60fps
    // };
    
    // function stopRotating() {
    //     if (rotateIntervalRef.current) {
    //         clearInterval(rotateIntervalRef.current);
    //         rotateIntervalRef.current = null;
    //     }
    // };

    // function smoothResetBearing () {
    //     const animationRef = { current: null };

    //     const animate = () => {
    //         setMapBearing(prev => {
    //         // Normalize bearing to -180 to 180 range for shortest path
    //         let current = prev % 360;
    //         if (current > 180) current -= 360;
    //         if (current < -180) current += 360;

    //         // If close enough to 0, snap to 0 and stop
    //         if (Math.abs(current) < 0.5) {
    //             cancelAnimationFrame(animationRef.current);
    //             return 0;
    //         }

    //         // Ease towards 0 — multiply by 0.85 each frame for smooth deceleration
    //         return current * 0.85;
    //         });

    //         animationRef.current = requestAnimationFrame(animate);
    //     };

    //     animationRef.current = requestAnimationFrame(animate);
    // };

    return (
        <div className="map-page">
            {/* <MapView 
                userLocation={mapCenter}
                currentCoords={userCurrentLocation}
                trackingEnabled={trackingEnabled}
                onMapClickForPin={handleMapClickForPin}   // FIX: was passing handleCenterToPin (wrong fn)
                onMarkerClick={handleCenterToPin}         // FIX: was missing — centers map when a pin is clicked
                onClosePinForm={handleClosePinForm}       // FIX: was missing — lets MapView close the pin form
                bearing={mapBearing}
                onBearingChange={setMapBearing}    
            /> */}
        
            { isSearching && 
            <section className='search-overlay'>  
                <div></div>
                <div className='px-large py-medium search-list'>
                    {filteredServices.map((service) => 
                        <div className='flex gap-large py-medium'>
                            <div><Icon name='map' size="large"/></div>
                            <div>
                                <Heading>{service.name}</Heading>
                                <Text><em className="text-muted">{service.address}</em></Text>
                            </div>
                        </div>
                    )}
                </div>
            </section> 
            }
    
            <header>
                <div className='flex items-center gap-medium px-large py-medium search-div'>
                    {(isSearching) && 
                        <div 
                            className='flex items-center gap-xsmall cursor-pointer'
                            onClick={() => setSearching(false)}
                        >
                            <Icon name="back" size='small'/><Text><em className='fw-bold'>Back</em></Text>
                        </div>
                    }
                    <InputField 
                        className='py-medium border-roundify' 
                        icon="search"
                        placeholder="Search for services..."
                        onFocus = {() => setSearching(true)}
                        value={searchQuery}
                        onChange = {setSearchQuery}
                    />
                    {(!isSearching) && <img className='border-circlify' src={Yu} alt="Yu Profile" width="36px" height="36px"/>}
                </div>
            </header>
            {/* <main className='map-utils'>
                <div className="rotation-controls">                
                    <CircularButton
                        className="rotate-btn bg-component-dark"
                        onMouseDown={() => startRotating("left")}
                        onMouseUp={stopRotating}
                        onMouseLeave={stopRotating}
                        onTouchStart={() => startRotating("left")}
                        onTouchEnd={stopRotating}
                    ><strong className='text-white'>↺</strong></CircularButton>
                    <CircularButton
                        className="rotate-btn bg-component-dark"
                        onClick={smoothResetBearing}
                    ><strong className='text-white'>⊙</strong></CircularButton>
                    <CircularButton
                        className="rotate-btn bg-component-dark"
                        onMouseDown={() => startRotating("right")}
                        onMouseUp={stopRotating}
                        onMouseLeave={stopRotating}
                        onTouchStart={() => startRotating("right")}
                        onTouchEnd={stopRotating}
                    ><strong className='text-white'>↻</strong></CircularButton>
                </div>
                <div className='main-controls'>
                    <CircularButton width='55px' className='bg-component-dark' onClick={handleRecenter}>
                        <Icon name='compass' size='large'/>    
                    </CircularButton>
                </div>
            </main> */}
        </div>
    );
}