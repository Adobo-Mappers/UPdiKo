import './ServicesPage.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { InputField, Dropdown } from './../../../components/form/';
import { Caption, Heading, Text, Title } from './../../../components/typography/';
import { Icon, Tab, Card } from './../../../components/ui/';
import { getCurrentUser } from './../../../services/supabase.js';
import Yu from './../../../assets/images/profile/profile.jpg';

import { supabase } from './../../../services/supabase.js';

export default function ServicesPage() {
    // check user auth
    const [user, setUser] = useState(null);
    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    // fetch service and set all tags and filters
    const [services, setServices] = useState([]);
    useEffect(() => {
        async function fetchServices() {
            const { data, error } = await supabase
                .from('static_locations')
                .select('id, name, tags, address, latitude, longitude, opening_hours, contact_info, services, images, additional_info, location_type');
            if (error) {
                console.error('Error fetching services:', error);
                return;
            }
            setServices(data || []);
        }

        fetchServices();
    }, []);
    const SERVICE_TAGS = ['All', ...new Set(services.flatMap(service => service.tags ?? []))];
    const FILTER_OPTIONS = ['Nearest Location', 'Top Rated', 'Open Now'];
    
    // states 
    const [activeTag, setActiveTag] = useState('All');
    const [activeFilter, setActiveFilter] = useState('Nearest Location');
    const [searchQuery, setSearchQuery] = useState('');

    // filtered services to be displayed 
    const filteredServices = services.filter((service) => {
        const matchesTag = activeTag === 'All' || (service.tags ?? []).includes(activeTag);
        const matchesSearch = service.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTag && matchesSearch;
    });

    return (
        <div className='services-page'>
            <header className='flex justify-end px-large py-medium'>
                <img className='border-circlify' src={Yu} alt='Yu Profile' width='36px' height='36px' />
            </header>

            <section className='px-large py-medium'>
                <Title>Good Day, <span className='text-accent'>Yu!</span></Title>
                <Heading>What services do you want to find today?</Heading>
                <div className='my-medium'>
                    <InputField
                        className='border-roundify py-medium'
                        icon='search'
                        placeholder='Search for services...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Tab
                    className='py-small'
                    value={activeTag}
                    options={SERVICE_TAGS}
                    onChange={setActiveTag}
                    activeClassName='fw-bold'
                />
            </section>

            <section className='px-large py-medium flex-col'>
                <div className='flex justify-between items-center gap-medium'>
                    <div>
                        <Heading>Services</Heading>
                        <Caption className='text-muted'>Showing {filteredServices.length} services</Caption>
                    </div>
                    <Dropdown
                        value={activeFilter}
                        onChange={setActiveFilter}
                        options={FILTER_OPTIONS}
                        className='border-roundify'
                    />
                </div>
                <hr/>
                <div className='gap-medium' style={{"overflow" : "auto", "height" : "350px"}}>
                    {filteredServices.length > 0 && filteredServices.map((service) => (
                        <Link key={service.id} to={`/service/info/${service.id}`} className='text-inherit'>
                            <Card service={service} className="my-medium"/>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}