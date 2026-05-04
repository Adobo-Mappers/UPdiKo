import './MapPage.css';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button, CircularButton, InputField, Dropdown } from './../../../components/form/';
import { Caption, Heading, Text, Title } from './../../../components/typography/';
import { Icon, MapView } from './../../../components/ui/';
import { supabase, getCurrentUser } from './../../../services/supabase.js';

import Yu from './../../../assets/images/profile/profile.jpg';


export default function MapPage() {
    // get service id 
    const { id } = useParams();

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
    const [activeTab, setActiveTab] = useState(SERVICE_TAGS[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setSearching] = useState(false);

    // filtered services to be displayed 
    const filteredServices = services.filter((service) => {
        return service.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="map-page">
            <MapView/>

            { isSearching && 
            <section className='search-overlay'>                
                <div className='px-large py-xlarge'>
                    {filteredServices.map((service) => 
                        <div className='flex gap-large py-medium'>
                            <div><Icon name='map' size="large"/></div>
                            <div>
                                <Heading>{service.name}</Heading>
                                <Text><em className="text-muted">{service.address}</em></Text>
                            </div>
                        </div>
                    )}
                </div>
            </section> 
            }
    
            <header>
                <div className='flex items-center gap-medium px-large py-medium search-div'>
                    {(isSearching) && 
                        <div 
                            className='flex items-center gap-xsmall cursor-pointer'
                            onClick={() => setSearching(false)}
                        >
                            <Icon name="back" size='small'/><Text><em className='fw-bold'>Back</em></Text>
                        </div>
                    }
                    <InputField 
                        className='py-medium border-roundify' 
                        icon="search"
                        placeholder="Search for services..."
                        onFocus = {() => setSearching(true)}
                        value={searchQuery}
                        onChange = {(e) => setSearchQuery(e.target.value)}
                    />
                    {(!isSearching) && <img className='border-circlify' src={Yu} alt="Yu Profile" width="36px" height="36px"/>}
                </div>
                <Tab className='px-large'
                    value={activeTab}
                    options={SERVICE_TAGS} 
                    onChange={setActiveTab} 
                    defaultClassName='bg-white px-medium py-xsmall border-roundify'
                    activeClassName='fw-bold bg-accent-soft px-medium py-xsmall border-roundify'
                />  
            </header>
            <section className='map-utils'>
                <CircularButton className='border-circlify'>
                    <Icon name='compass' size='large'/>    
                </CircularButton>
            </section>
        </div>
    );
}