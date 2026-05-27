import { useParams, Link } from 'react-router-dom';
import { usePublicLocations } from '../../../hooks/useUnifiedLocations.js';
import { Heading, Text, Title } from '../../../components/typography/index.js';
import { Icon, Card } from '../../../components/ui/index.js';
import { InputField } from '../../../components/form/';
import Fuse from 'fuse.js';
import { useState, useMemo } from 'react';
import { TAG_GROUPS } from '../../../utils/servicecoding.js';

export default function ServiceCategoryPage() {
    const { category } = useParams();
    const { data: services, isLoading } = usePublicLocations();
    const [searchQuery, setSearchQuery] = useState(''); // New search state

    const groupData = TAG_GROUPS[category];
    const allowedTags = groupData?.tags || [];
    const categoryServices = useMemo(() => {
        return services?.filter((service) => {
            return category === "All" ||
                (Array.isArray(service.tags) && service.tags.some(tag => allowedTags.includes(tag)));
        }) || [];
    }, [services, category, allowedTags]);
    const serviceSearch = useMemo(() => new Fuse(categoryServices, {
        keys: [
            { name: 'name', weight: 2 },
            { name: 'address', weight: 1 },
            { name: 'tags', weight: 1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
    }), [categoryServices]);

    const trimmedSearchQuery = searchQuery.trim();
    const filteredServices = trimmedSearchQuery
        ? serviceSearch.search(trimmedSearchQuery).map((result) => result.item)
        : categoryServices;

    return (
        <div className='services-page px-xlarge'>
            <main className='py-xlarge'>
                <div className="flex flex-col bg-white p-xlarge border-roundify">
                    <Link to="/service/" className='flex items-center gap-small text-inherit'>
                        <Icon name="back" size='small' />
                        <Text>Back</Text>
                    </Link>
                    <Title className='mt-large fw-extra-bold'>{category}</Title>
                    <div className='px-small'>
                        <Heading>
                            {groupData?.description || `Explore ${category} services.`}
                        </Heading>
                        <div className='mt-large'>
                            <InputField
                                className='border-roundify py-medium'
                                icon='search'
                                placeholder={`Search in ${category}...`}
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />
                        </div>
                    </div>
                </div>

                <div id="service-list" className='flex flex-col gap-medium mt-medium mx-large'>
                    {isLoading ? (
                        <div className="flex justify-center py-xlarge">
                             <div className="spinner"></div> {/* Use your existing spinner */}
                        </div>
                    ) : filteredServices.length > 0 ? (
                        filteredServices.map((service, index) => (
                            <Link 
                                key={service.id} 
                                to={`/service/${encodeURIComponent(category)}/${service.id}`}
                                className='flex'
                                style={{"width": "clamp(200px, 67vw, 300px)", "alignSelf": `${(index % 2 === 0) ? "start" : "end"}`}} 
                            >   
                                <div className={`w-100 bg-white my-small border-roundify p-medium ${(index % 2 == 0)? "rotate-left": "rotate-right"}`}>
                                    { service.images[0] ? ( 
                                        <img
                                            src={service.images[0]}
                                            style={{"width": "100%", "height": "clamp(120px, 40vw, 170px)", "objectFit": "cover"}}
                                            className='border-roundify'
                                        />
                                        ) : (
                                        <div
                                            style={{"width": "100%", "height": "clamp(120px, 40vw, 170px)", "objectFit": "cover", "backgroundColor": "#212121"}}
                                            className='border-roundify'
                                        ></div>
                                        )
                                    }
                                    
                                    <div className='py-small px-medium'>
                                        <Heading className='fw-bold'>{service.name}</Heading>
                                        <div className='flex items-center gap-xsmall p-xsmall'>
                                            <Icon name='address' size='small' />
                                            <Text className='fw-regular'>{service.address}</Text>
                                        </div>
                                    </div>    

                                    <div className='flex justify-end items-center gap-xsmall'>
                                        <Text>See More</Text>    
                                        <Icon name='front' size='small' />    
                                    </div>                          
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="px-large py-large text-center border-roundify bg-white">
                            <Text>No locations found while searching...</Text>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
