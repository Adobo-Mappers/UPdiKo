import './ServicesPage.css';
import Fuse from 'fuse.js';
import { useEffect, useMemo, useState } from 'react';
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
    const [searchQuery, setSearchQuery] = useState('');
    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    const serviceCategories = useMemo(() => {
        return Object.entries(TAG_GROUPS).map(([groupName, groupData]) => ({
            groupName,
            description: groupData.description,
            tags: groupData.tags || [],
        }));
    }, []);
    const categorySearch = useMemo(() => new Fuse(serviceCategories, {
        keys: [
            { name: 'groupName', weight: 2 },
            { name: 'description', weight: 1 },
            { name: 'tags', weight: 1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
    }), [serviceCategories]);
    const trimmedSearchQuery = searchQuery.trim();
    const filteredCategories = trimmedSearchQuery
        ? categorySearch.search(trimmedSearchQuery).map((result) => result.item)
        : serviceCategories;

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

                <div className='my-large'>
                    <InputField
                        className='border-roundify py-medium'
                        icon='search'
                        placeholder='Search services...'
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                </div>

                <div id="service-list" className='gap-medium overflow-y'>
                    {filteredCategories.map(({ groupName, description }) => (
                        <Link key={groupName} to={`/service/${groupName}/`} className='text-inherit'>
                            <div className="my-medium bg-component px-large py-medium border-rounded">
                                <Heading>{groupName}</Heading>
                                <Text className='fw-regular'>{description}</Text>
                            </div>
                        </Link>
                    ))}
                </div>

            </main>
        </div>
    );
}
