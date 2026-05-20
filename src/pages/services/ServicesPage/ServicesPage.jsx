import './ServicesPage.css';
import Fuse from 'fuse.js';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { InputField, Dropdown } from './../../../components/form/';
import { Heading, Text, Title } from './../../../components/typography/';
import { Icon, Card } from './../../../components/ui/';
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
            <main className='p-xlarge'>
                <Title className='fw-bold' style={{"position" : "relative", "top" : "10px"}}>Good Day</Title>
                <Title className='fw-bold text-accent'>{user ? (user.user_metadata?.display_name?.split(' ')[0] + '!') : ''}</Title>                
                <WeatherView />
                
                <Heading className='fw-bold pt-large'>What services do you want to find?</Heading>
                <div id="service-list">
                    {Object.entries(TAG_GROUPS).map(([name, value ]) => (
                        <Link key={name} to={`/service/${name}/`} className='text-inherit'>
                            <div className="flex my-large px-large gap-large py-medium border-roundify border-solid"> 
                                <div className=' flex items-center'>
                                    <Icon name={value.icon} size='xlarge'/>
                                </div>
                                <div>
                                    <Heading>{name}</Heading>
                                    <Text className='fw-regular py-xsmall'>{value.description}</Text>
                                </div>
                                <div className=' flex items-center'>
                                    <Icon name='front'/>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main> 
        </div>
    );
}
