import './ServicesPage.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { InputField, Dropdown } from './../../../components/form/';
import { Heading, Text, Title } from './../../../components/typography/';
import { Icon, Card, Profile } from './../../../components/ui/';
import { getCurrentUser } from './../../../services/supabase.js';
import { hasServiceCache, fetchServicesFromServer, getAllServicesFromCache } from './../../../services/service-handler.js';
import { usePublicLocations } from '../../../hooks/useUnifiedLocations.js';
import { TAG_GROUPS } from '../../../utils/servicecoding.js';
import EventDisplay from '../../../components/events/EventDisplay.jsx';
import WeatherView from '../../../components/weather/Weather.jsx';

export default function ServicesPage() {
    // user auth
    const [user, setUser] = useState(null);
    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    return (
        <div className='services-page'>
            <header className='flex justify-end px-large py-medium'>
                <Profile user={user} />
            </header>
            <main className='p-large'>
                <Title>Good Day <span className='text-accent'>{user ? (user.user_metadata?.display_name?.split(' ')[0] + '!') : ''}</span></Title>
                <Heading>What services do you want to find.</Heading>

                {/* Weather + Event cards side by side — matches design */}
                <div className='flex gap-medium my-medium'>
                    <WeatherView />
                    <EventDisplay />
                </div>

                <div id="service-list" className='gap-medium overflow-y'>
                    {Object.entries(TAG_GROUPS).map(([groupName, groupData]) => (
                        <Link key={groupName} to={`/service/${groupName}/`} className='text-inherit'>
                            <div className="my-medium bg-component px-large py-medium border-rounded">
                                <Heading>{groupName}</Heading>
                                <Text className='fw-regular'>{groupData.description}</Text>
                            </div>
                        </Link>
                    ))}
                </div>

            </main>
        </div>
    );
}
