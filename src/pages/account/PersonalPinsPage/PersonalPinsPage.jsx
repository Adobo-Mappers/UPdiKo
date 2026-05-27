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
    console.log(pins);
    return (
        <div className="personal-pins-page px-xlarge">
            <main className='py-xlarge'>
                {/* Main Header Container */}
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

                {/* Pin Grid Wrapper */}
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
                                style={{"width": "clamp(200px, 67vw, 300px)", "alignSelf": `${(index % 2 === 0) ? "start" : "end"}`}} 
                            >       
                                <div className={`w-100 bg-white my-small border-roundify p-medium ${(index % 2 === 0) ? "rotate-left" : "rotate-right"}`}>
                                    
                                    {/* Map Preview Placeholder Block */}
                                    <div
                                        style={{
                                        "width": "100%", 
                                        "height": "clamp(120px, 40vw, 170px)", 
                                        "display": "flex", 
                                        "alignItems": "center", 
                                        "justifyContent": "center", 
                                        "backgroundColor": "#212121",
                                        "overflow": "hidden" // Prevents images from bleeding past rounded corners
                                    }}
                                    className='border-roundify text-white'
                                >   
                                    {(pin.img) && (
                                        <img 
                                            src={pin.imageUrl} 
                                            alt={pin.locationName} 
                                            style={{
                                                width: "100%",
                                                height: "clamp(120px, 40vw, 170px)",
                                                objectFit: "cover" // Ensures the image crops nicely instead of stretching
                                            }}
                                        />
                                    )}
                                </div>
                                    
                                    {/* Name and Description Content Details Wrapper */}
                                    <div className='py-small px-medium flex flex-col gap-xsmall'>
                                        {/* Name container limited to max 2 lines before ellipsis */}
                                        <div style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            maxHeight: '48px', /* Adjust based on typography standard line height */
                                        }}>
                                            <Heading className='fw-bold'>{pin.locationName}</Heading>
                                        </div>

                                        {/* Description container limited to exactly 40px height with clean multiline ellipsis */}
                                        <div style={{
                                            height: '40px',
                                            overflow: 'hidden',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical'
                                        }}>
                                            <Text className='text-muted' style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                                                {pin.description || "No description provided."}
                                            </Text>
                                        </div>
                                    </div>    

                                    {/* Action row container */}
                                    <div className='flex justify-between items-center gap-xsmall pt-small' style={{ borderTop: '1px solid var(--color-component-bg, #f4f4f4)' }}>
                                        <Icon
                                            name='delete'
                                            size='medium'
                                            className='cursor-pointer text-danger'
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(pin.id);
                                            }}
                                        />
                                        <div className='flex items-center gap-xsmall'>
                                            <Text className='fw-extra-bold'>View Pin</Text>    
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