import './ServiceInfoPage.css'
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../components/form';
import { Icon, Carousel, Tag, Profile } from './../../../components/ui';
import { Text, Caption, Heading } from './../../../components/typography'
import { supabase, getCurrentUser } from './../../../services/supabase.js';
import { getServiceFromCache, fetchServicesFromServer, hasServiceCache } from './../../../services/service-handler.js';
import Yu from './../../../assets/images/profile/profile.jpg';

export default function ServiceInfoPage() {
    // check user auth
    const [user, setUser] = useState(null);
    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);
    
    // get service id 
    const { id } = useParams();
    
    // fetching service
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function loadService() {
            if (!id) return;
            if (!hasServiceCache) {
                await fetchServicesFromServer();
            } 
            setService(getServiceFromCache(id));
            setLoading(false);
        }
        loadService();
    }, [id]);

    const [isSaved, setSaved] = useState(false);  // supposedly if service saved by user 
    function toggleSaveButton() {
        setSaved(!isSaved);
    }

    // view when loading
    if (loading) {
        return (
            <div className="service-info-page px-large py-medium">
                <div className='py-medium'>
                    <Heading ><em className='fw-bold'>Loading Data</em></Heading>
                    <Text>This page is currently getting the service's information...</Text>
                </div>
            </div>
        );
    }

    // view when service is not found
    if (!service) {
        return (
            <div className="service-info-page px-large py-medium">
                <Link to="/service" className='flex items-center gap-small'>
                    <Icon name="back" size='small'/>
                    <Text>Back</Text>
                </Link>
                <div className='py-medium'>
                    <Heading ><em className='fw-bold'>Service not found</em></Heading>
                    <Text>This page does not contain any services.</Text>
                </div>
            </div>
        );
    }

    // for parsing service contact info
    function parseContactInfo (infoArray) {
        if (!Array.isArray(infoArray)) return { email: null, phone: null };
        
        const result = { email: null, phone: null };
        
        infoArray.forEach((info) => {
            if (typeof info === 'string') {
                if (info.toLowerCase().startsWith('email:')) {
                    result.email = info.replace(/^email:\s*/i, '').trim();
                } else if (info.toLowerCase().startsWith('phone:')) {
                    result.phone = info.replace(/^phone:\s*/i, '').trim();
                }
            }
        });
        
        return result;
    };

    return (
        <div className="service-info-page">
            <header className='px-large py-medium  flex justify-between'>
                <Link to="/service" className='flex items-center gap-small'>
                    <Icon name="back" size='small'/>
                    <Text>Back</Text>
                </Link>
                <Profile user={user}/>
            </header> 

            
            <main className='px-large py-medium '>
                {service.images.length > 0 ? (<Carousel imageUrls={service.images}/>) : ""}   

                <div className='flex justify-end my-medium'>
                    <Tag>{service.tags[0]}</Tag>
                </div>

                <div className='py-small flex justify-between'>
                    <Heading><em className='fw-bold'>{service.name}</em></Heading>
                    <div className='flex items-center gap-small'>
                        <Icon name='star' size='small'/>
                        <Text>4.5 <em className="text-muted">(243 reviews)</em></Text>
                    </div>                    
                </div>

                <div className='flex-col'>
                    <div className='flex items-center gap-small my-xsmall'><Icon name='address'/><Text>{service.address}</Text></div>
                    <div className='flex items-center gap-small my-xsmall'><Icon name='clock'/><Text>{service.opening_hours[0]}</Text></div>
                </div>
                <div className='flex gap-small my-medium'>
                    <Button href={`/map?id=${id}`} className="items-center gap-small">
                        <Icon name='map'/>
                        <Caption>View in Map</Caption>
                    </Button>
                    {user && 
                        <Button className="items-center gap-small" toggled={isSaved} onClick={() => toggleSaveButton()}>
                            <Icon name='save'/>
                            <Caption>{(isSaved) ? "Saved" : "Save"}</Caption>
                        </Button>
                    }
                </div>


                <div>
                    { service.additional_info.text_based.length > 0 && 
                        <Heading><em className='fw-bold'>Additional Information</em></Heading>}
                    { service.additional_info.text_based.length > 0 && 
                        (service.additional_info.text_based.map((info) =>                         
                        <Text className='text-muted my-xsmall'>
                            {info}   
                        </Text>
                        ))
                    } 
                </div>
                <div className='py-medium '>
                    {service.contact_info && (() => {
                        const { email, phone } = parseContactInfo(service.contact_info);
                        return (
                            <>
                                {email && (
                                    <div className='flex items-center gap-small my-xsmall'>
                                        <Icon name='mail' size='small'/>
                                        <Text><em className='text-muted'>{email}</em></Text>
                                    </div>
                                )}
                                {phone && (
                                    <div className='flex items-center gap-small my-xsmall'>
                                        <Icon name='phone' size='small'/>
                                        <Text><em className='text-muted'>{phone}</em></Text>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </main>

        </div>
    )
}