import './MapPage.css';
import { useParams, useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TAG_GROUPS } from './../../../utils/servicecoding.js';
import { Button, CircularButton, InputField } from './../../../components/form/';
import { Heading, Text, Subtitle } from './../../../components/typography/';
import { Icon, MapView } from './../../../components/ui/';
import { getCurrentUser, addPinnedLocationToDB } from './../../../services/supabase.js';
import { hasServiceCache, getAllServicesFromCache, fetchServicesFromServer, getServiceFromCache } from '../../../services/service-handler.js';
import { reverseGeocode } from '../../../services/geocoding.js';
import { uploadPinImage } from '../../../services/storageService.js';
import { submitLocationReview } from '../../../services/reviewsService.js';
import { NOTIFICATION_ACTIONS, notify, notifyAction } from '../../../services/notificationCenter.js';
import CassieWidget from '../../../components/casie/CassieWidget.jsx';

export default function MapPage() {
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
    const [isFilterOpen, setFilterOpen] = useState(false);

    const activeCategoryTags = TAG_GROUPS[activeTag]?.tags || [];
    const filterServiceByActiveTag = (service) => {
        if (activeTag === 'All') return true;
        if (!Array.isArray(service.tags)) return false;
        const serviceTags = service.tags.map((tag) => String(tag).toLowerCase());
        return serviceTags.some((tag) => activeCategoryTags.includes(tag));
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setSearching] = useState(false);
    const serviceSearch = useMemo(() => new Fuse(services, {
        keys: [
            { name: 'name', weight: 2 },
            { name: 'address', weight: 1 },
            { name: 'tags', weight: 1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
    }), [services]);
    const trimmedSearchQuery = searchQuery.trim();
    const filteredServices = trimmedSearchQuery
        ? serviceSearch.search(trimmedSearchQuery).map((result) => result.item).filter(filterServiceByActiveTag)
        : services.filter(filterServiceByActiveTag);

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

    const [selectedService, setSelectedService] = useState(null);

    // Keep selectedService in sync when URL 'id' or cached services alter
    useEffect(() => {
        if (id) {
            const service = getServiceFromCache(id);
            if (service) {
                setSelectedService(service);
                // FIXED: Uses functional state updates to pull and maintain the user's current zoom level
                setMapCenter(prev => ({ 
                    lat: Number(service.latitude), 
                    lng: Number(service.longitude), 
                    zoom: prev.zoom // Maintain existing zoom level
                }));
            }
        } else {
            setSelectedService(null);
        }
    }, [id, services]);

    // map tracking logic
    const defaultCenter = { lat: 10.641944, lng: 122.235556 };
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [userCurrentLocation, setUserCurrentLocation] = useState(null);
    const watchIdRef = useRef(null);
    const [trackingEnabled, setTrackingEnabled] = useState(false);

    // modal logic
    const [rating, setRating] = useState(0);
    const [isRating, setRatingAction] = useState(false);
    const [isSubmittingMapRating, setSubmittingMapRating] = useState(false);

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
    function handleCenterToPin(lat, lng, zoomLevel) {
        setTrackingEnabled(false);
        setMapCenter(prev => ({
            lat,
            lng,
            zoom: zoomLevel !== undefined ? zoomLevel : prev.zoom
        }));
    }

    // map recenter to user logic
    function handleRecenter() {
        const newTrackingState = !trackingEnabled;
        setTrackingEnabled(newTrackingState);

        // Always reset bearing when recenter is clicked
        smoothResetBearing();

        if (newTrackingState && userCurrentLocation) {
            setMapCenter(userCurrentLocation);
        } else if (!userCurrentLocation && newTrackingState) {
            notify({ message: 'User location is not available', type: 'error' });
            setTrackingEnabled(false);
        }

    }

    // B2: open pin form with reverse geocoding to auto-fill address
    async function handleMapClickForPin({ lat, lng }) {
        if (!user) {
            notifyAction(NOTIFICATION_ACTIONS.PIN_CREATE, 'error', {
                message: 'Please log in first to create personal pins',
            });
            return;
        }

        // Reset the pin sheet transform position so it doesn't stay hidden when reopened
        if (pinSheetRef.current) {
            pinSheetRef.current.style.transform = 'translateY(0)';
        }

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
            notifyAction(NOTIFICATION_ACTIONS.PIN_CREATE, 'success');
        } catch (e) {
            notifyAction(NOTIFICATION_ACTIONS.PIN_CREATE, 'error');
        }
    }

    async function handleSubmitMapRating() {
        if (!user || !selectedService?.id) {
            notifyAction(NOTIFICATION_ACTIONS.MAP_RATING, 'error');
            return;
        }

        if (!rating) {
            notifyAction(NOTIFICATION_ACTIONS.MAP_RATING, 'error', {
                message: 'Please select a rating first',
            });
            return;
        }

        setSubmittingMapRating(true);
        try {
            await submitLocationReview({
                locationId: Number(selectedService.id),
                userId: user.id,
                userName: user.user_metadata?.display_name ?? user.email,
                rating,
                comment: '',
            });
            notifyAction(NOTIFICATION_ACTIONS.MAP_RATING, 'success');
            setRating(0);
            setRatingAction(false);
        } catch (e) {
            notifyAction(NOTIFICATION_ACTIONS.MAP_RATING, 'error');
        } finally {
            setSubmittingMapRating(false);
        }
    }

    function startRotating(direction) {
        rotateIntervalRef.current = setInterval(() => {
            setMapBearing(prev => prev + (direction === "left" ? -2 : 2));
        }, 16);
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
                let current = prev % 360;
                if (current > 180) current -= 360;
                if (current < -180) current += 360;

                if (Math.abs(current) < 0.5) {
                    cancelAnimationFrame(animationRef.current);
                    return 0;
                }
                return current * 0.85;
            });
            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);
    }

    // --- REFACTORED DRAG & BOTTOM SHEET SYSTEM ---
    const startY = useRef(null);
    const dragY = useRef(0);
    const isDragging = useRef(false);
    
    // Dedicated hooks for separate dom element control
    const markerPanelRef = useRef(null);
    const pinSheetRef = useRef(null);

    function onDragStart(e, targetRef) {
        startY.current = e.clientY;
        isDragging.current = true;
        dragY.current = 0;
        e.currentTarget.setPointerCapture?.(e.pointerId);

        if (targetRef.current) {
            targetRef.current.style.transition = 'none';
        }
    }

    function onDragMove(e, targetRef) {
        if (!isDragging.current || startY.current === null || !targetRef.current) return;

        const delta = Math.max(0, e.clientY - startY.current);
        dragY.current = delta;
        targetRef.current.style.transform = `translateY(${delta}px)`;
    }

    function onDragEnd(e, targetRef, closeActionType) {
        if (!isDragging.current || !targetRef.current) return;

        e.currentTarget.releasePointerCapture?.(e.pointerId);
        targetRef.current.style.transition = 'transform 0.25s ease';

        if (dragY.current > 140) {
            targetRef.current.style.transform = 'translateY(100%)';
            setTimeout(() => {
                if (closeActionType === 'PIN_FORM') {
                    handleClosePinForm();
                } else {
                    handleClosePanel();
                }
            }, 200);
        } else {
            targetRef.current.style.transform = 'translateY(0)';
        }

        dragY.current = 0;
        startY.current = null;
        isDragging.current = false;
    }

    return (
        <div className="map-page">
            <MapView
                userLocation={mapCenter}
                currentCoords={userCurrentLocation}
                trackingEnabled={trackingEnabled}
                selectedService={selectedService}
                handleMarkerClick={handleMarkerClick}
                onMapClickForPin={handleMapClickForPin}
                onMarkerClick={handleCenterToPin}
                onClosePinForm={handleClosePinForm}
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
                    <div className='px-large py-small search-list'>
                        {!searchQuery && searchHistory.length > 0 && (
                            <div className='mb-large mx-small bg-white border-roundify px-large py-xlarge'>
                                <div className='flex items-center gap-small mb-small'>
                                    <Icon name='map'/>
                                    <Heading className='fw-extra-bold'>Recent</Heading>
                                </div>
                                {searchHistory.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{'display':'grid', 'gridTemplateColumns': '24px 1fr 24px'}}
                                        className=' items-center gap-small py-medium mx-small'
                                        onClick={() => {
                                            const found = services.find(s => s.id === item.id);
                                            if (found) {
                                                handleMarkerClick(found.id);
                                                setSearching(false);
                                                handleCenterToPin(found.latitude, found.longitude);
                                            }
                                        }}
                                    >
                                        <div><Icon name='clock' size='medium' /></div>
                                        <div>
                                            <Heading>{item.name}</Heading>
                                            <Text>{item.address}</Text>
                                        </div>
                                        <div><Icon name='front' size="small" /></div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className='my-small mx-small bg-white border-roundify px-large py-xlarge'>
                            <div className='flex items-center gap-small mb-small'>
                                <Icon name='map'/>
                                <Heading className='fw-extra-bold'>Services</Heading>
                            </div>
                            {(filteredServices.length) ? 
                                filteredServices.map((service) =>
                                    <div
                                        key={service.id}
                                        style={{'display':'grid', 'gridTemplateColumns': '24px 1fr 24px'}}
                                        className='items-center gap-small py-medium mx-small'
                                        onClick={() => {
                                            handleMarkerClick(service.id);
                                            setSearching(false);
                                            addToHistory(service);
                                            handleCenterToPin(service.latitude, service.longitude);
                                        }}
                                    >
                                        <div><Icon name='address' size="medium" /></div>
                                        <div>
                                            <Heading>{service.name}</Heading>
                                            <Text >{service.address}</Text>
                                        </div>
                                        <div><Icon name='front' size="small" /></div>
                                    </div>
                                ) : (<div className='items-center gap-small py-medium mx-small'><Text>There are no services with that search.</Text></div>)
                            }
                        </div>
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
                        <Button disabled={isSubmittingMapRating} onClick={handleSubmitMapRating}>
                            <Icon name='darkstar' />
                            {isSubmittingMapRating ? 'Submitting...' : 'Rate'}
                        </Button>
                    </div>
                </section>
            }

            {/* B2: Create personal pin sheet — appears when user clicks/long-presses the map */}
            {isPinFormOpen &&
                <section className='pin-form-sheet py-large px-xlarge' ref={pinSheetRef}>
                    <div className="drag-region">
                        <div
                            className="drag-handle"
                            style={{ cursor: 'grab' }}
                            onPointerDown={(e) => onDragStart(e, pinSheetRef)}
                            onPointerMove={(e) => onDragMove(e, pinSheetRef)}
                            onPointerUp={(e) => onDragEnd(e, pinSheetRef, 'PIN_FORM')}
                            onPointerCancel={(e) => onDragEnd(e, pinSheetRef, 'PIN_FORM')}
                        />
                    </div>
                    <div className='flex justify-between items-center py-small gap-xlarge'>
                         <InputField
                            icon='edit'
                            className='bg-none fs-subtitle p-none pl-large'
                            placeholder='Pin name'
                            value={pinName}
                            onChange={setPinName}
                        />
                        <Icon name='close' size='small' className='cursor-pointer' onClick={handleClosePinForm} />
                    </div>
                    <div className='flex flex-col  gap-small py-medium px-large'>
                        <InputField
                            icon='address'
                            className='border-roundify py-medium'
                            placeholder='Address'
                            value={pinAddress}
                            onChange={setPinAddress}
                        />
                        <InputField
                            icon='address'
                            className='border-roundify py-medium'
                            placeholder='Tags (comma separated)'
                            value={pinTags}
                            onChange={setPinTags}
                        />
                        <textarea 
                            className='w-100 bg-component border-none border-roundify p-medium'
                            placeholder='Description'
                            value={pinDescription}
                            onChange={(e) => setPinDescription(e.target.value)}
                        ></textarea>

                        <div className="file-upload-wrapper border-solid border-roundify px-small py-xsmall cursor-pointer" style={{"width": "50%"}}>
                            <label htmlFor="pin-image-upload" className="custom-file-button items-center flex gap-small">
                                <Icon name="photo" size="small" /> 
                                <Text>{pinImageFile ? pinImageFile.name : 'Choose Pin Image'}</Text>
                            </label>
                            <input
                                id="pin-image-upload"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => setPinImageFile(e.target.files?.[0] || null)}
                            />
                        </div>
                        <div className='flex justify-end'>
                            <Button className='border-solid' onClick={handleAddPin}>Save Pin</Button>
                        </div>
                    </div>
                </section>
            }

            {/* Selected Marker Info Panel / Bottom Sheet */}
            {selectedService && !isPinFormOpen && (
                <section className='marker-info-sheet py-large px-xlarge' ref={markerPanelRef}>
                    <div className="drag-region">
                        <div
                            className="drag-handle"
                            style={{ cursor: 'grab' }}
                            onPointerDown={(e) => onDragStart(e, markerPanelRef)}
                            onPointerMove={(e) => onDragMove(e, markerPanelRef)}
                            onPointerUp={(e) => onDragEnd(e, markerPanelRef, 'MARKER_PANEL')}
                            onPointerCancel={(e) => onDragEnd(e, markerPanelRef, 'MARKER_PANEL')}
                        />
                    </div>
                    <div className='flex justify-between items-start py-small'>
                        <div>
                            <Heading className="fw-extra-bold">{selectedService.name}</Heading>
                            <Subtitle className="text-muted">{selectedService.address}</Subtitle>
                        </div>
                        <Icon name='close' size='small' className='cursor-pointer' onClick={handleClosePanel} />
                    </div>
                    <div className='py-medium'>
                        <Text>{selectedService.description || "No description provided."}</Text>
                        {selectedService.tags && (
                            <div className='flex gap-xsmall flex-wrap mt-small'>
                                {selectedService.tags.map(tag => (
                                    <span key={tag} className='tag-badge'>{tag}</span>
                                ))}
                            </div>
                        )}
                        <div className='flex gap-small mt-medium'>
                            <Button onClick={() => setRatingAction(true)}>
                                <Icon name="star" size="small" /> Rate Service
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            <header className='px-xlarge py-small bg-accent-soft'>
                <div className='flex items-center gap-medium search-div'>
                    {isSearching &&
                        <div
                            className='flex items-center gap-xsmall cursor-pointer border-circlify bg-white p-xsmall'
                            onClick={() => setSearching(false)}
                        >
                            <Icon name="back"/>
                        </div>
                    }
                    <InputField
                        className='py-medium border-roundify bg-white'
                        icon="search"
                        placeholder="Search for services..."
                        onFocus={() => { setSearching(true); }}
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                </div>

                {!isSearching && (
                    <div className="filter-dropdown-container">
                        <button
                            type="button"
                            className="filter-dropdown-trigger"
                            onClick={() => setFilterOpen((open) => !open)}
                        >
                            <span className="filter-dropdown-label">
                                <span>{activeTag}</span>
                            </span>
                            <Icon name='down'/>
                        </button>

                        {isFilterOpen && (
                            <div className="filter-dropdown-menu">
                                {Object.entries(TAG_GROUPS).map(([name, data]) => (
                                    <button
                                        key={name}
                                        type="button"
                                        className={`filter-dropdown-item ${activeTag === name ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveTag(name);
                                            setFilterOpen(false);
                                        }}
                                    >
                                        <span>{name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </header>

            <main className='map-utils'>
                <div className='main-controls flex flex-col gap-small'>
                    <CircularButton width='64px' className='bg-component-dark' onClick={handleRecenter}>
                        <Icon name='compass' size='large' />
                    </CircularButton>
                     <CircularButton width='64px' className='bg-component-dark' onClick={() => startRotating("left")}>
                        <Icon name='compass' size='large' />
                    </CircularButton>
                    <CassieWidget
                        currentSection='MAP'
                        selectedService={selectedService}
                        userLocation={userCurrentLocation}
                        onNavigateToLocation={(location) => {
                            handleMarkerClick(location.id);
                        }}
                    />
                </div>
            </main>
        </div>
    );
}
