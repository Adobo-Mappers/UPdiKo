import './PersonalPinsPage.css';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/ui';
import { Text, Heading, Title } from '../../../components/typography';
import { getCurrentUser, getPinnedLocationsFromDB, deletePinnedLocationFromDB } from '../../../services/supabase';

export default function PersonalPinsPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [pins, setPins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function loadPins() {
            try {
                const u = await getCurrentUser();
                if (!mounted) return;

                if (!u) {
                    navigate('/account/login', { replace: true });
                    return;
                }

                setUser(u);
                const locations = await getPinnedLocationsFromDB(u.id);
                if (!mounted) return;
                setPins(locations);
            } catch (error) {
                console.error('Failed to load personal pins:', error);
                if (mounted) setPins([]);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadPins();

        return () => {
            mounted = false;
        };
    }, [navigate]);

    async function handleDelete(pinId) {
        await deletePinnedLocationFromDB(user.id, pinId);
        setPins((prev) => prev.filter((p) => p.id !== pinId));
    }

    function handleOpenPin(pinId) {
        navigate(`/map/${pinId}`);
    }

    if (loading) return null;

    return (
        <div className="personal-pins-page px-xlarge">
            <main className='py-xlarge'>
                {/* Main Header Container Styled Like ServiceCategoryPage */}
                <div className="flex flex-col bg-white p-xlarge border-roundify">
                    <Link to="/account" className='flex items-center gap-small text-inherit'>
                        <Icon name="back" size='small' />
                        <Text>Back</Text>
                    </Link>
                    
                    <Title className='mt-large fw-extra-bold'>Your Pins</Title>
                    
                    <div className='px-small'>
                        <Heading>
                            Personal locations you've saved on the map.
                        </Heading>
                    </div>
                </div>

                {/* Pin Grid Wrapper matching the layout from #service-list */}
                <div id="pins-list" className='flex flex-col gap-medium mt-medium mx-large' style={{ paddingBottom: '80px' }}>
                    {pins.length === 0 ? (
                        <div className="px-large py-large text-center border-roundify bg-white">
                            <Text>No pins yet. Tap the map to create one.</Text>
                        </div>
                    ) : (
                        pins.map((pin, index) => (
                            <div 
                                key={pin.id} 
                                onClick={() => handleOpenPin(pin.id)}
                                className='flex cursor-pointer'
                                role='button'
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleOpenPin(pin.id);
                                    }
                                }}
                                /* Alternates cards side-to-side (start vs end) just like Service Category cards */
                                style={{"width": "300px", "alignSelf": `${(index % 2 === 0) ? "start" : "end"}`}} 
                            >   
                                {/* Alternating card rotation effects (rotate-left vs rotate-right) */}
                                <div className={`w-100 bg-white my-small border-roundify p-medium ${(index % 2 === 0) ? "rotate-left" : "rotate-right"}`}>
                                    
                                    {/* Map Preview Placeholder Block mimicking the Service Image layer */}
                                    <div
                                        style={{"width": "100%", "height": "170px", "display": "flex", "alignItems": "center", "justifyContent": "center", "backgroundColor": "#212121"}}
                                        className='border-roundify text-white'
                                    >
                                        <Icon name='map' size='large' />
                                    </div>
                                    
                                    {/* Context Details Wrapper */}
                                    <div className='py-small px-medium'>
                                        <Heading className='fw-bold'>{pin.locationName}</Heading>
                                        
                                        <div className='flex items-center gap-xsmall p-xsmall'>
                                            <Icon name='address' size='small' />
                                            <Text className='fw-regular text-muted'>{pin.address}</Text>
                                        </div>
                                        
                                        {pin.description && (
                                            <div className='p-xsmall'>
                                                <Text className='text-muted' style={{ fontStyle: 'italic' }}>{pin.description}</Text>
                                            </div>
                                        )}
                                    </div>    

                                    {/* Action row container with Delete capability added */}
                                    <div className='flex justify-between items-center gap-xsmall pt-small'>
                                        <Icon
                                            name='delete'
                                            size='small'
                                            className='cursor-pointer text-danger'
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(pin.id);
                                            }}
                                        />
                                        <div className='flex items-center gap-xsmall'>
                                            <Text>View Pin</Text>    
                                            <Icon name='front' size='small' />    
                                        </div>
                                    </div>                                    
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
