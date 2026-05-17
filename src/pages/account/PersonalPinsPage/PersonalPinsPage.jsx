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
        <div className="personal-pins-page">
            <main className='flex flex-col px-large py-medium'>
                <div className='py-medium'>
                    <Link to="/account" className='flex items-center gap-small'>
                        <Icon name="back" size='small' />
                        <Text>Back</Text>
                    </Link>
                </div>

                <Title>Your <em className='text-accent'>Pins</em></Title>
                <Heading className='my-small'>Personal locations you've saved on the map.</Heading>

                <div className='my-large flex flex-col gap-medium' style={{ paddingBottom: '80px' }}>
                    {pins.length === 0 ? (
                        <div className='p-large bg-component border-rounded flex justify-center'>
                            <Text className='text-muted'>No pins yet. Tap the map to create one.</Text>
                        </div>
                    ) : (
                        pins.map((pin) => (
                            <div
                                key={pin.id}
                                className='pin-card flex gap-medium p-medium border-rounded bg-component cursor-pointer'
                                role='button'
                                tabIndex={0}
                                onClick={() => handleOpenPin(pin.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleOpenPin(pin.id);
                                    }
                                }}
                            >
                                <Icon name='map' size='large' />
                                <div className='flex flex-col' style={{ flex: 1 }}>
                                    <Text><em className='fw-bold'>{pin.locationName}</em></Text>
                                    <Text className='text-muted'>{pin.address}</Text>
                                    {pin.description && <Text className='text-muted'>{pin.description}</Text>}
                                </div>
                                <Icon
                                    name='delete'
                                    size='small'
                                    className='cursor-pointer'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(pin.id);
                                    }}
                                />
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
