import './ServicesPage.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { InputField, Dropdown } from './../../../components/form/';
import { Heading, Text, Title } from './../../../components/typography/';
import { Icon, Card, Profile } from './../../../components/ui/';
import { getCurrentUser } from './../../../services/supabase.js';
import { hasServiceCache, fetchServicesFromServer, getAllServicesFromCache } from './../../../services/service-handler.js';
import { usePublicLocations } from '../../../hooks/useUnifiedLocations.js';
import EventDisplay from '../../../components/events/EventDisplay.jsx';
import WeatherView from '../../../components/weather/Weather.jsx';

export default function ServicesPage() {
    // user auth
    const [user, setUser] = useState(null);
    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    // B2: TanStack Query for locations
    const { data: queryServices } = usePublicLocations();

    // B1: cache-based fetch as fallback
    const [cachedServices, setCachedServices] = useState([]);
    useEffect(() => {
        async function loadServices() {
            if (!hasServiceCache()) {
                await fetchServicesFromServer();
            }
            setCachedServices(getAllServicesFromCache());
        }
        loadServices();
    }, []);
    console.log(cachedServices[0]);

    // Prefer query data, fall back to cache
    const services = queryServices?.length ? queryServices : cachedServices;

    const SERVICE_TAGS = ['All', ...new Set(services.flatMap(service => service.tags ?? []))];
    const FILTER_OPTIONS = ['Nearest Location', 'Top Rated', 'Open Now'];

    const [activeTag, setActiveTag] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredServices = services.filter((service) => {
        const matchesTag = activeTag === 'All' || (service.tags ?? []).includes(activeTag);
        const matchesSearch = service.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTag && matchesSearch;
    });

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

                <div className='my-medium'>
                    <InputField
                        className='border-roundify py-medium'
                        icon='search'
                        placeholder='Search for services...'
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                </div>

                <div id="category-tab" className="flex overflow-x my-large">
                    {SERVICE_TAGS.map((tag) => (
                        <div
                            key={tag}
                            className={(activeTag === tag) ? 'active' : ''}
                            onClick={() => setActiveTag(tag)}
                        >
                            {tag}
                        </div>
                    ))}
                </div>

                <div className='flex py-xsmall'>
                    <Heading><strong>{activeTag} Services</strong></Heading>
                </div>

                <hr />

                <div id="service-list" className='gap-medium overflow-y'>
                    {filteredServices.length > 0 && filteredServices.map((service) => (
                        <Link key={service.id} to={`/service/info/${service.id}`} className='text-inherit'>
                            <Card service={service} className="my-medium" />
                        </Link>
                    ))}
                </div>

            </main>
        </div>
    );
}
