import './ServiceInfoPage.css'
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../components/form';
import { Icon, Carousel, Tag, Profile } from './../../../components/ui';
import { Text, Caption, Heading } from './../../../components/typography';
import { getCurrentUser, addPinnedLocationToDB } from './../../../services/supabase.js';
import { getServiceFromCache, fetchServicesFromServer, hasServiceCache } from './../../../services/service-handler.js';
import { getLocationReviews, submitLocationReview } from '../../../services/reviewsService.js';

export default function ServiceInfoPage() {
    // user auth
    const [user, setUser] = useState(null);
    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    // get service id
    const { id } = useParams();

    // fetch service from cache
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function loadService() {
            if (!id) return;
            if (!hasServiceCache()) {
                await fetchServicesFromServer();
            }
            setService(getServiceFromCache(id));
            setLoading(false);
        }
        loadService();
    }, [id]);

    // Save as personal pin
    const [isSaved, setSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    async function toggleSaveButton() {
        if (!user || !service || isSaving) return;
        if (isSaved) { setSaved(false); return; } // future: implement unsave
        setIsSaving(true);
        try {
            await addPinnedLocationToDB(user.id, {
                locationName: service.name,
                address: service.address || 'Miagao, Iloilo',
                latitude: parseFloat(service.latitude),
                longitude: parseFloat(service.longitude),
                description: service.additional_info?.text_based?.[0] || '',
                tags: service.tags || [],
                imageUrl: service.images?.[0] || null,
            });
            setSaved(true);
        } catch (e) {
            console.error('Save pin failed:', e);
        } finally {
            setIsSaving(false);
        }
    }

    // B2: reviews
    const [reviews, setReviews] = useState([]);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewTab, setReviewTab] = useState('info'); // 'info' | 'reviews'
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        if (!id) return;
        getLocationReviews(Number(id))
            .then(setReviews)
            .catch(() => setReviews([]));
    }, [id]);

    async function handleSubmitReview() {
        if (!user || reviewRating === 0) return;
        setSubmittingReview(true);
        try {
            await submitLocationReview({
                locationId: Number(id),
                userId: user.id,
                userName: user.user_metadata?.display_name ?? user.email,
                rating: reviewRating,
                comment: reviewComment,
            });
            const updated = await getLocationReviews(Number(id));
            setReviews(updated);
            setReviewRating(0);
            setReviewComment('');
        } catch (e) {
            console.error('Review submit failed:', e);
        } finally {
            setSubmittingReview(false);
        }
    }

    function parseContactInfo(infoArray) {
        if (!Array.isArray(infoArray)) return { email: null, phone: null };
        const result = { email: null, phone: null };
        infoArray.forEach((info) => {
            if (typeof info === 'string') {
                if (info.toLowerCase().startsWith('email:'))
                    result.email = info.replace(/^email:\s*/i, '').trim();
                else if (info.toLowerCase().startsWith('phone:'))
                    result.phone = info.replace(/^phone:\s*/i, '').trim();
            }
        });
        return result;
    }

    const avgRating = reviews.length
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    if (loading) {
        return (
            <div className="service-info-page px-large py-medium">
                <Heading><em className='fw-bold'>Loading Data</em></Heading>
                <Text>Getting service information...</Text>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="service-info-page px-large py-medium">
                <Link to="/service" className='flex items-center gap-small'>
                    <Icon name="back" size='small' />
                    <Text>Back</Text>
                </Link>
                <div className='py-medium'>
                    <Heading><em className='fw-bold'>Service not found</em></Heading>
                    <Text>This page does not contain any services.</Text>
                </div>
            </div>
        );
    }

    const { email, phone } = parseContactInfo(service.contact_info);

    return (
        <div className="service-info-page">
            <header className='px-large py-medium flex justify-between'>
                <Link to="/service" className='flex items-center gap-small'>
                    <Icon name="back" size='small' />
                    <Text>Back</Text>
                </Link>
                <Profile user={user} />
            </header>

            <main className='px-large py-medium'>
                {service.images?.length > 0 && <Carousel imageUrls={service.images} />}

                <div className='flex justify-end my-medium'>
                    <Tag>{service.tags?.[0]}</Tag>
                </div>

                <div className='py-small flex justify-between'>
                    <Heading><em className='fw-bold'>{service.name}</em></Heading>
                    <div className='flex items-center gap-small'>
                        <Icon name='star' size='small' />
                        <Text>
                            {avgRating ?? '—'}
                            <em className="text-muted"> ({reviews.length} reviews)</em>
                        </Text>
                    </div>
                </div>

                <div className='flex-col'>
                    <div className='flex items-center gap-small my-xsmall'>
                        <Icon name='address' /><Text>{service.address}</Text>
                    </div>
                    <div className='flex items-center gap-small my-xsmall'>
                        <Icon name='clock' /><Text>{service.opening_hours?.[0]}</Text>
                    </div>
                </div>

                <div className='flex gap-small my-medium'>
                    <Button href={`/map?id=${id}`} className="items-center gap-small">
                        <Icon name='map' /><Caption>View in Map</Caption>
                    </Button>
                    {user &&
                        <Button className="items-center gap-small" toggled={isSaved} onClick={toggleSaveButton} disabled={isSaving}>
                            <Icon name='save' /><Caption>{isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}</Caption>
                        </Button>
                    }
                </div>

                {/* B2: Tab switcher */}
                <div className='flex gap-large my-medium'>
                    <Text
                        className={`cursor-pointer ${reviewTab === 'info' ? 'fw-bold text-accent' : 'text-muted'}`}
                        onClick={() => setReviewTab('info')}
                    >
                        Information
                    </Text>
                    <Text
                        className={`cursor-pointer ${reviewTab === 'reviews' ? 'fw-bold text-accent' : 'text-muted'}`}
                        onClick={() => setReviewTab('reviews')}
                    >
                        Reviews ({reviews.length})
                    </Text>
                </div>

                {reviewTab === 'info' && (
                    <div>
                        {service.additional_info?.text_based?.length > 0 && (
                            <>
                                <Heading><em className='fw-bold'>Additional Information</em></Heading>
                                {service.additional_info.text_based.map((info, i) => (
                                    <Text key={i} className='text-muted my-xsmall'>{info}</Text>
                                ))}
                            </>
                        )}
                        <div className='py-medium'>
                            {email && (
                                <div className='flex items-center gap-small my-xsmall'>
                                    <Icon name='mail' size='small' />
                                    <Text><em className='text-muted'>{email}</em></Text>
                                </div>
                            )}
                            {phone && (
                                <div className='flex items-center gap-small my-xsmall'>
                                    <Icon name='phone' size='small' />
                                    <Text><em className='text-muted'>{phone}</em></Text>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* B2: Reviews tab */}
                {reviewTab === 'reviews' && (
                    <div className='my-medium'>
                        {user && (
                            <div className='flex flex-col gap-small p-medium bg-component border-rounded my-medium'>
                                <Text><em className='fw-bold'>Leave a Review</em></Text>
                                <div className='flex gap-small'>
                                    {[1,2,3,4,5].map(n => (
                                        <Icon
                                            key={n}
                                            name={reviewRating >= n ? 'star' : 'darkstar'}
                                            size='medium'
                                            className='cursor-pointer'
                                            onClick={() => setReviewRating(n)}
                                        />
                                    ))}
                                </div>
                                <textarea
                                    className='p-small border-rounded'
                                    style={{ width: '100%', border: 'none', background: 'white', fontFamily: 'inherit', fontSize: 'var(--fs-text)', resize: 'none', minHeight: '60px' }}
                                    placeholder='Write your comment...'
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                />
                                <Button
                                    onClick={handleSubmitReview}
                                    disabled={reviewRating === 0 || submittingReview}
                                >
                                    {submittingReview ? 'Submitting...' : 'Submit'}
                                </Button>
                            </div>
                        )}

                        {reviews.length === 0 ? (
                            <Text className='text-muted'>No reviews yet. Be the first!</Text>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.id} className='flex flex-col gap-xsmall p-medium my-small bg-component border-rounded'>
                                    <div className='flex justify-between items-center'>
                                        <Text><em className='fw-bold'>{review.userName}</em></Text>
                                        <div className='flex gap-xsmall'>
                                            {[1,2,3,4,5].map(n => (
                                                <Icon key={n} name={review.rating >= n ? 'star' : 'darkstar'} size='small' />
                                            ))}
                                        </div>
                                    </div>
                                    {review.comment && <Text className='text-muted'>{review.comment}</Text>}
                                    <Caption className='text-muted'>{new Date(review.created_at).toLocaleDateString()}</Caption>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
