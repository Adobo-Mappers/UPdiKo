import './ServicesPage.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { InputField, Dropdown } from './../../../components/form/';
import { Caption, Heading, Text, Title } from './../../../components/typography/';
import { Icon, Card, Profile } from './../../../components/ui/';
import { getCurrentUser } from './../../../services/supabase.js';
import { supabase } from './../../../services/supabase.js';
import { hasServiceCache, fetchServices, getAllServices } from './../../../services/service-handler.js';

export default function ServicesPage() {
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
                const data = await fetchServices();
                setServices(data || []);
            } else {
                setServices(getAllServices());  
            }
        }
        loadServices();
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
                <Profile user={user}/>
            </header>
            <main className='p-large'>
                <Title>Good Day <span className='text-accent'>{( (user) ? "Yu!" : "" )}</span></Title>
                <Heading>What services do you want to find today?</Heading>
                
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
                            className={(activeTag === tag) ? "active" : ""}
                            onClick= {() => setActiveTag(tag)}
                        >
                        {tag}
                        </div>
                    ))}
                </div>

                <div className='flex py-xsmall justify-between'>
                    <Heading><strong>{activeTag} Services</strong></Heading>
                    <Dropdown
                        value={activeFilter}
                        onChange={setActiveFilter}
                        options={FILTER_OPTIONS}
                        className='border-roundify'
                    />
                </div>
                
                <hr/>
                
                <div id="service-list" className='gap-medium overflow-y'>
                    {filteredServices.length > 0 && filteredServices.map((service) => (
                        <Link key={service.id} to={`/service/info/${service.id}`} className='text-inherit'>
                            <Card service={service} className="my-medium"/>
                        </Link>
                    ))}
                </div>

            </main>
            
            {/*
            
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
            </section> */}
        </div>
    );
}