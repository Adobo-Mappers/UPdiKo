import './ServicesPage.css';
import Fuse from 'fuse.js';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { InputField, Dropdown } from './../../../components/form/';
import { Heading, Text, Title } from './../../../components/typography/';
import { Icon, Card } from './../../../components/ui/';
import { getCurrentUser } from './../../../services/supabase.js';
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
        <div className='services-page px-xlarge'>
            <main className='py-xlarge'>
                <div className='flex flex-col justify-center p-xlarge bg-white border-roundify'>
                    <Title className='fw-extra-bold lh-large pt-medium'>Good Day {user ? (user.user_metadata?.display_name?.split(' ')[0]) : "" }!</Title>
                    <WeatherView />
                    <Heading className='pt-small px-small'>What services do you want to find?</Heading>
                </div>
                <div id="service-list">
                    {Object.entries(TAG_GROUPS).map(([name, value], index) => (
                        <Link key={name} to={`/service/${name}/`} className='text-inherit'>
                            <div className={`flex my-xlarge mx-small px-large gap-large py-medium border-roundify bg-white ${ (index % 2 == 0) ? 'rotate-left': 'rotate-right'}`}> 
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
