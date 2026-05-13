import './MapPage.css';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, CircularButton, InputField } from './../../../components/form/';
import { Heading, Text } from './../../../components/typography/';
import { Icon, MapView } from './../../../components/ui/';
import { getCurrentUser, addPinnedLocationToDB } from './../../../services/supabase.js';
import { hasServiceCache, getAllServicesFromCache, fetchServicesFromServer, getServiceFromCache } from '../../../services/service-handler.js';
import { reverseGeocode } from '../../../services/geocoding.js';
import { uploadPinImage } from '../../../services/storageService.js';
import CassieWidget from '../../../components/casie/CassieWidget.jsx';

import Yu from './../../../assets/images/profile/profile.jpg';

export default function MapPage() {
    // TODO: Map recenterings (the compass) requires two presses to recenter (the first tap will recenter, but succeding recenters need two taps :<)

    // check user auth
    const [user, setUser] = useState(null);
    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    // fetch service and set all tags and filters
    const [services, setServices] = useState([]);
    useEffect(() => {
        async function loadServices() {
            if (!hasServiceCache()) {
                await fetchServicesFromServer();
            }
            setServices(getAllServicesFromCache());
        }
        loadServices();
    }, []);

    const SERVICE_TAGS = ['All', ...new Set(services.flatMap(service => service.tags ?? []))];

    // searching services logic
    const [activeTag, setActiveTag] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setSearching] = useState(false);
    const filteredServices = services.filter((service) => {
        return service.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Search history (persisted to localStorage)
    const HISTORY_KEY = 'updi_search_history';
    const [searchHistory, setSearchHistory] = useState(() => {
        try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
        catch { return []; }
    });

    function addToHistory(service) {
        setSearchHistory(prev => {
            const filtered = prev.filter(s => s.id !== service.id);
            const updated = [{ id: service.id, name: service.name, address: service.address }, ...filtered].slice(0, 5);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
            return updated;
        });
    }

    // get service id from url
    const { id } = useParams();
    const navigate = useNavigate();
    const handleMarkerClick = (markerId) => {
        navigate(`/map/${markerId}`);
    };

    // When a user closes the info panel:
    const handleClosePanel = () => {
        navigate('/map');
    };

    const [selectedService, setSelectedService] = useState(getServiceFromCache(id));

    // map tracking logic
    const defaultCenter = { lat: 10.641944, lng: 122.235556 };                  // default coords
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [userCurrentLocation, setUserCurrentLocation] = useState(null);       // user's latest GPS coordinate
    const watchIdRef = useRef(null);                                             // ref to hold the watchPosition ID so we can clear it later
    const [trackingEnabled, setTrackingEnabled] = useState(false);              // controls whether the map should automatically pan to the user's location

    // modal logic
    const [rating, setRating] = useState(0);
    const [isRating, setRatingAction] = useState(false);

    // B2: pin creation state — opened when user taps the map to drop a personal pin
    const queryClient = useQueryClient();
    const [isPinFormOpen, setIsPinFormOpen] = useState(false);
    const [pinFormCoords, setPinFormCoords] = useState(null);
    const [pinName, setPinName] = useState('');
    const [pinAddress, setPinAddress] = useState('');
    const [pinDescription, setPinDescription] = useState('');
    const [pinTags, setPinTags] = useState('');
    const [pinImageFile, setPinImageFile] = useState(null);
    const reverseGeocodeControllerRef = useRef(null);

    // map rotation logic
    const rotateIntervalRef = useRef(null);
    const [mapBearing, setMapBearing] = useState(0);

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
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
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

    // map centering logic — also passed to MapView as onMarkerClick
    function handleCenterToPin(lat, lng, zoomLevel = 17) {
        setTrackingEnabled(false);
        setMapCenter({ lat, lng, zoom: zoomLevel });
    }

    // map recenter to user logic
    function handleRecenter() {
        const newTrackingState = !trackingEnabled;
        setTrackingEnabled(newTrackingState);

        if (newTrackingState && userCurrentLocation) {
            setMapCenter(userCurrentLocation);
        } else if (!userCurrentLocation) {
            alert("User location is not available.");
            setTrackingEnabled(false);
        }
    }

    // B2: open pin form with reverse geocoding to auto-fill address
    async function handleMapClickForPin({ lat, lng }) {
        if (!user) { alert('Please log in first to create personal pins.'); return; }

        setPinFormCoords({ lat, lng });
        setPinAddress('Loading address...');
        setIsPinFormOpen(true);

        reverseGeocodeControllerRef.current?.abort();
        reverseGeocodeControllerRef.current = new AbortController();
        try {
            const address = await reverseGeocode(lat, lng, {
                signal: reverseGeocodeControllerRef.current.signal,
            });
            setPinAddress(address);
        } catch (e) {
            if (e.name !== 'AbortError') setPinAddress('Miagao, Iloilo');
        }
    }

    function handleClosePinForm() {
        reverseGeocodeControllerRef.current?.abort();
        setIsPinFormOpen(false);
        setPinFormCoords(null);
        setPinName('');
        setPinAddress('');
        setPinDescription('');
        setPinTags('');
        setPinImageFile(null);
    }

    // B2: save pin with optional image upload to Supabase Storage
    async function handleAddPin() {
        if (!user || !pinFormCoords) return;
        try {
            let imageUrl = null;
            if (pinImageFile) imageUrl = await uploadPinImage(pinImageFile, user.id);
            await addPinnedLocationToDB(user.id, {
                locationName: pinName || 'Untitled Pin',
                address: pinAddress || 'Miagao, Iloilo',
                latitude: Number(pinFormCoords.lat),
                longitude: Number(pinFormCoords.lng),
                description: pinDescription,
                tags: pinTags.split(',').map(t => t.trim()).filter(Boolean),
                imageUrl,
            });
            await queryClient.invalidateQueries({ queryKey: ['user-locations', user.id] });
            handleClosePinForm();
        } catch (e) {
            alert(e.message);
        }
    }

    function startRotating(direction) {
        rotateIntervalRef.current = setInterval(() => {
            setMapBearing(prev => prev + (direction === "left" ? -2 : 2));
        }, 16); // ~60fps
    }

    function stopRotating() {
        if (rotateIntervalRef.current) {
            clearInterval(rotateIntervalRef.current);
            rotateIntervalRef.current = null;
        }
    }

    function smoothResetBearing() {
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
    }

    return (
        <div className="map-page">
            <MapView
                userLocation={mapCenter}
                currentCoords={userCurrentLocation}
                trackingEnabled={trackingEnabled}
                selectedService={selectedService}
                handleMarkerClick={handleMarkerClick}
                onMapClickForPin={handleMapClickForPin}   // FIX: was passing handleCenterToPin (wrong fn)
                onMarkerClick={handleCenterToPin}         // FIX: was missing — centers map when a pin is clicked
                onClosePinForm={handleClosePinForm}       // FIX: was missing — lets MapView close the pin form
                bearing={mapBearing}
                onBearingChange={setMapBearing}
                setRatingSession={setRatingAction}
                isRating={isRating}
                activeTag={activeTag}
            />

            {/* Search overlay */}
            {isSearching &&
                <section className='search-overlay'>
                    <div></div>
                    <div className='px-large py-medium search-list'>
                        {/* Show recent searches when no query typed */}
                        {!searchQuery && searchHistory.length > 0 && (
                            <div className='my-small'>
                                <Text className='text-muted'><em>Recent searches</em></Text>
                                {searchHistory.map((item) => (
                                    <div
                                        key={item.id}
                                        className='flex gap-large py-medium'
                                        onClick={() => {
                                            const found = services.find(s => s.id === item.id);
                                            if (found) {
                                                handleMarkerClick(found.id);
                                                setSelectedService(found);
                                                setSearching(false);
                                                handleCenterToPin(found.latitude, found.longitude);
                                            }
                                        }}
                                    >
                                        <div><Icon name='clock' size='large' /></div>
                                        <div>
                                            <Heading>{item.name}</Heading>
                                            <Text><em className='text-muted'>{item.address}</em></Text>
                                        </div>
                                    </div>
                                ))}
                                <hr className='my-small' />
                            </div>
                        )}
                        {filteredServices.map((service) =>
                            <div
                                key={service.id}
                                className='flex gap-large py-medium'
                                onClick={() => {
                                    handleMarkerClick(service.id);
                                    setSelectedService(service);
                                    setSearching(false);
                                    addToHistory(service);
                                    handleCenterToPin(service.latitude, service.longitude);
                                }}
                            >
                                <div><Icon name='map' size="large" /></div>
                                <div>
                                    <Heading>{service.name}</Heading>
                                    <Text><em className="text-muted">{service.address}</em></Text>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            }

            {/* Rating modal */}
            {isRating &&
                <section className='rating-modal'>
                    <Heading><strong>How was your experience?</strong></Heading>
                    <div className='flex justify-center gap-large py-medium'>
                        {[1,2,3,4,5].map(n => (
                            <Icon key={n} name={rating >= n ? "star" : "darkstar"} size='large' onClick={() => setRating(n)} />
                        ))}
                    </div>
                    <div className='flex justify-end items-center'>
                        <div className='flex px-medium' onClick={() => setRatingAction(false)}><strong>Cancel</strong></div>
                        <Button><Icon name='darkstar' />Rate</Button>
                    </div>
                </section>
            }

            {/* B2: Create personal pin sheet — appears when user long-presses the map */}
            {isPinFormOpen &&
                <section className='pin-form-sheet'>
                    <div className='flex justify-between items-center py-small'>
                        <Heading><em className='fw-bold'>New Pin</em></Heading>
                        <Icon name='close' size='small' className='cursor-pointer' onClick={handleClosePinForm} />
                    </div>
                    <hr className='my-small' />
                    <div className='flex flex-col gap-small'>
                        <InputField
                            className='border-roundify py-medium'
                            placeholder='Pin name'
                            value={pinName}
                            onChange={setPinName}
                        />
                        <InputField
                            className='border-roundify py-medium'
                            placeholder='Address'
                            value={pinAddress}
                            onChange={setPinAddress}
                        />
                        <InputField
                            className='border-roundify py-medium'
                            placeholder='Tags (comma separated)'
                            value={pinTags}
                            onChange={setPinTags}
                        />
                        <InputField
                            className='border-roundify py-medium'
                            placeholder='Description'
                            value={pinDescription}
                            onChange={setPinDescription}
                        />
                        <input
                            type='file'
                            accept='image/*'
                            className='py-small'
                            onChange={(e) => setPinImageFile(e.target.files?.[0] || null)}
                        />
                    </div>
                    <div className='flex justify-end my-medium'>
                        <Button onClick={handleAddPin}>Save Pin</Button>
                    </div>
                </section>
            }

            <header className='px-large'>
                <div className='flex items-center gap-medium py-small search-div'>
                    {isSearching &&
                        <div
                            className='flex items-center gap-xsmall cursor-pointer'
                            onClick={() => setSearching(false)}
                        >
                            <Icon name="back" size='small' /><Text><em className='fw-bold'>Back</em></Text>
                        </div>
                    }
                    <InputField
                        className='py-medium border-roundify'
                        icon="search"
                        placeholder="Search for services..."
                        onFocus={() => { setSearching(true); setSelectedService(""); }}
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                    {!isSearching && <img className='border-circlify' src={Yu} alt="Yu Profile" width="36px" height="36px" />}
                </div>

                <div id="category-tab" className="flex overflow-x">
                    {SERVICE_TAGS.map((tag) => (
                        <div
                            key={tag}
                            className={`${activeTag === tag ? "active" : ""} flex bg-white px-small py-xsmall border-roundify`}
                            onClick={() => setActiveTag(tag)}
                        >
                            {tag}
                        </div>
                    ))}
                </div>
            </header>

            <main className='map-utils'>
                {/* <div className="rotation-controls">
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
                </div> */}
                <div className='main-controls flex flex-col gap-small'>
                    <CircularButton width='55px' className='bg-component-dark' onClick={handleRecenter}>
                        <Icon name='compass' size='large' />
                    </CircularButton>
                    {/* B2: Casie AI floating widget */}
                    <CassieWidget
                        currentSection='MAP'
                        selectedService={selectedService}
                        userLocation={userCurrentLocation}
                        onNavigateToLocation={(location) => {
                            setSelectedService(location);
                            handleCenterToPin(Number(location.latitude), Number(location.longitude));
                        }}
                    />
                </div>
            </main>
        </div>
    );
}
