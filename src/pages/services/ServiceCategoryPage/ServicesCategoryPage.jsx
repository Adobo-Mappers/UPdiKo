import { useParams, Link } from 'react-router-dom';
import { usePublicLocations } from '../../../hooks/useUnifiedLocations.js';
import { Heading, Text, Title } from '../../../components/typography/index.js';
import { Icon, Card, Profile } from '../../../components/ui/index.js';
import { InputField } from '../../../components/form/';
import Fuse from 'fuse.js';
import { useState, useEffect, useMemo } from 'react';
import { getCurrentUser } from '../../../services/supabase.js';
import { TAG_GROUPS } from '../../../utils/servicecoding.js';

export default function ServiceCategoryPage() {
    const { category } = useParams();
    const { data: services, isLoading } = usePublicLocations();
    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // New search state

    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

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
        <div className='services-page'>
            <header className='flex justify-between items-center px-large py-medium'>
                <Link to="/service" className='flex items-center gap-small text-inherit'>
                    <Icon name="back" size='small' />
                    <Text className="fw-bold">Back</Text>
                </Link>
                <Profile user={user} />
            </header>

            <main className='p-large'>
                <div className="mb-large">
                    <div className="flex items-center gap-small mb-xsmall">
                        <Title>{category}</Title>
                    </div>
                    <Heading className="text-muted">
                        {groupData?.description || `Explore ${category} services.`}
                    </Heading>
                </div>

                <div className='my-large'>
                    <InputField
                        className='border-roundify py-medium'
                        icon='search'
                        placeholder={`Search in ${category}...`}
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                </div>

                <div id="service-list" className='flex flex-col gap-medium'>
                    {isLoading ? (
                        <div className="flex justify-center py-xlarge">
                             <div className="spinner"></div> {/* Use your existing spinner */}
                        </div>
                    ) : filteredServices.length > 0 ? (
                        filteredServices.map((service) => (
                            <Link 
                                key={service.id} 
                                to={`/service/${encodeURIComponent(category)}/${service.id}`} 
                                className='text-inherit'
                            >
                                <Card service={service} />
                            </Link>
                        ))
                    ) : (
                        <div className="px-large py-medium text-center border-rounded bg-component">
                            <Text className="text-muted">No locations found in this category.</Text>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
