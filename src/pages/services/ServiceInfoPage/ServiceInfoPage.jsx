import './ServiceInfoPage.css';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../components/form';
import { Icon, Carousel, Tag, shouldShowTag } from './../../../components/ui';
import { Text, Caption, Heading, Title } from './../../../components/typography';
import { getCurrentUser, onAuthStateChangedListener } from './../../../services/supabase.js';
import { getServiceFromCache, fetchServicesFromServer, hasServiceCache } from './../../../services/service-handler.js';
import { getLocationReviews, submitLocationReview, getLocationReviewOfUser, deleteLocationReview } from '../../../services/reviewsService.js';

export default function ServiceInfoPage() {
    // User Auth
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true); 
    useEffect(() => {
        const unsubscribe = onAuthStateChangedListener((user) => {
            setUser(user);
            setAuthLoading(false); 
        });
        return () => unsubscribe(); 
    }, []);

    // Get URL Parameters
    const { category, id } = useParams();
    
    // Service Cache Loading
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
    
    // Reviews Management State
    const [reviews, setReviews] = useState([]);
    const [savedRating, setSavedRating] = useState(0);
    const [reviewRating, setReviewRating] = useState(0);
    const [savedComment, setSavedComment] = useState('');
    const [reviewComment, setReviewComment] = useState('');
    const [reviewTab, setReviewTab] = useState('info'); // 'info' | 'photo' | 'reviews'
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewModal, setReviewModal] = useState(false);

    // Fetch Global Location Reviews
    useEffect(() => {
        if (!id) return;
        getLocationReviews(Number(id))
            .then(setReviews)
            .catch(() => setReviews([]));
    }, [id]);

    // FIX 1: Tied dependency array to user.id and location id to prevent infinite loops
    useEffect(() => {
        if (authLoading || !user || !id) return;
        
        getLocationReviewOfUser(id, user.id)
            .then(data => { 
                if (data) {
                    setReviewComment(data.comment || ''); 
                    setSavedComment(data.comment || ''); 
                    setReviewRating(data.rating || 0); 
                    setSavedRating(data.rating || 0);
                }
            })
            .catch(() => {
                setReviewComment(''); 
                setSavedComment(''); 
                setReviewRating(0);
                setSavedRating(0);
            });
    }, [authLoading, user?.id, id]);


    async function handleSubmitReview() {
        if (!user || !id) return;
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
            setSavedRating(reviewRating);
            setSavedComment(reviewComment);
            setReviewModal(false);
        } catch (e) {
            console.error('Review submit failed:', e);
        } finally {
            setSubmittingReview(false);
        }
    }

    async function handleClearReview() {
        if (!user || !id) return;
        setSubmittingReview(true);
        try {
            // 1. Delete review row directly from Database
            await deleteLocationReview(Number(id), user.id);
            
            // 2. Wipe the local component values completely clean
            setSavedComment("");
            setReviewComment("");
            setSavedRating(0);
            setReviewRating(0);
            
            // 3. Fetch a fresh copy of the global array list to update the screen count
            const updated = await getLocationReviews(Number(id));
            setReviews(updated);
            
            // 4. Shut the modal view container 
            setReviewModal(false);
        } catch (e) {
            console.error('Failed to remove review:', e);
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
    const visibleTags = Array.isArray(service.tags)
        ? service.tags.filter(shouldShowTag)
        : [];

    return (
        <div className="service-info-page px-xlarge">
            <main className='py-xlarge'>
                <div className='flex flex-col justify-center p-xlarge bg-white border-roundify rotate-left'>
                    <Link to={`/service/${category}`} className='flex items-center gap-small'>
                        <Icon name="back" size='small' />
                        <Text>Back</Text>
                    </Link>    
                    <Title className='pt-xlarge pb-medium fw-extra-bold'>{service.name}</Title>
                    <div className='flex gap-small'>
                        <Button href={`/map/${id}`} className="items-center border-solid">
                            <Icon name='map' /><Text>View in Map</Text>
                        </Button>
                        {user && !authLoading &&
                            <Button className="items-center" onClick={() => setReviewModal(true)}>
                                <Icon name='darkstar' /><Text>{savedRating ? "Edit Rating" : "Rate"}</Text>
                            </Button>
                        }   
                    </div>
                </div>      

                <div className='flex flex-col my-xlarge p-xlarge pt-medium bg-white border-roundify rotate-right' style={{"minHeight": "300px"}}>
                    <div className='flex gap-large my-medium'>
                        <Text
                            className={`cursor-pointer ${reviewTab === 'info' ? 'fw-bold text-accent' : 'text-muted'}`}
                            onClick={() => setReviewTab('info')}
                        >
                            Information
                        </Text>
                        <Text
                            className={`cursor-pointer ${reviewTab === 'photo' ? 'fw-bold text-accent' : 'text-muted'}`}
                            onClick={() => setReviewTab('photo')}
                        >
                            Photos
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
                        <Heading className='flex gap-small py-medium fw-extra-bold'>
                            <Icon name='map' size='large'/>
                            Information
                        </Heading>

                        <div className='flex-col mx-small'>
                            <div className='flex items-center gap-small my-xsmall'>
                                <Icon name='star' /><Text>{avgRating ?? "None"} <em className='text-muted'>({reviews.length === 1 ? "1 review" : `${reviews.length} reviews`})</em></Text>
                            </div>
                            <div className='flex items-center gap-small my-xsmall'>
                                <Icon name='address' /><Text>{service.address}</Text>
                            </div>
                            {service.opening_hours?.[0] &&
                                <div className='flex items-center gap-small my-xsmall'>
                                    <Icon name='clock' /><Text>{service.opening_hours[0]}</Text>
                                </div>
                            }
                            <div className='py-small'>
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
                                
                                {visibleTags.length > 0 &&
                                    <div className='flex gap-small flex-wrap'>
                                        {visibleTags.map((tag, idx) => (
                                            <div key={`${tag}-${idx}`} className='flex items-center gap-small my-xsmall'>
                                                <Tag name={tag}/>
                                            </div>
                                        ))}
                                    </div>
                                }
                                
                                {(service.additional_info?.text_based?.length > 0 || email || phone) ? (
                                    <div className='px-small'>
                                        {service.additional_info?.text_based?.map((info, i) => (
                                            <Text key={i} className='text-muted my-xsmall'>{info}</Text>
                                        ))}
                                    </div>
                                ) : (
                                    <Text>No additional information found.</Text>
                                )}
                            </div>
                        </div>
                    </div>
                    )}

                    {reviewTab === 'photo' && (
                        <div className='my-medium'>
                            <Heading className='flex gap-small pb-medium fw-extra-bold'>
                                <Icon name='eye' size='large'/>
                                Photos
                            </Heading>
                            {service.images?.length > 0 ? 
                                <Carousel imageUrls={service.images}/> :
                                <Text className='px-small'>No images found.</Text>
                            }
                        </div>
                    )} 

                    {reviewTab === 'reviews' && (
                        <div className='my-medium'>
                            <Heading className='flex gap-small pb-medium fw-extra-bold'>
                                <Icon name='darkstar' size='large'/>
                                Reviews
                            </Heading> 

                            {reviews.length === 0 ? (
                                <Text className='px-small'>No reviews yet. Be the first!</Text>
                            ) : (
                                reviews.map((review) => (
                                    <div key={review.id} className='flex flex-col gap-xsmall px-small mb-small border-rounded'>
                                        <div className='flex justify-between items-center'>
                                            <Text className='fw-bold'>{review.userName}</Text>
                                            <div className='flex gap-xsmall'>
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <Icon key={n} name={review.rating >= n ? 'star' : 'darkstar'} size='small' />
                                                ))}
                                            </div>
                                        </div>
                                        {review.comment && <Text className='text-muted'>{review.comment}</Text>}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>        
            </main>

            {reviewModal && (
                <div className='modal-container flex justify-center items-center px-xlarge'>
                    <div className='w-100 flex flex-col justify-center mx-medium p-large bg-white border-roundify'>
                        <div className='flex justify-between items-center'>
                            <Heading className='fw-extra-bold py-xsmall'>Rate the service</Heading>
                            <Icon className='flex items-center cursor-pointer' name='close' size='small' onClick={() => { setReviewModal(false); setReviewRating(savedRating); setReviewComment(savedComment); }}/>
                        </div>
                        <div className='flex justify-center my-medium gap-large'>
                            {[1, 2, 3, 4, 5].map((number) => (
                                <Icon key={number} name={number <= reviewRating ? "star" : "lightstar"} onClick={() => setReviewRating(number)} size='large' className='cursor-pointer'/>
                            ))}
                        </div>
                        <div className='px-small'>
                            <textarea disabled={submittingReview} value={reviewComment} className='w-100 bg-component border-none border-roundify p-medium' placeholder='Comment (Optional)' onChange={(e) => setReviewComment(e.target.value)} />
                        </div>
                        <div className='py-small flex justify-end gap-small'>
                            <Button disabled={submittingReview} onClick={handleClearReview}>Clear Rating</Button>
                            <Button disabled={submittingReview} className='border-solid' onClick={handleSubmitReview}>
                                {submittingReview ? "Submitting..." : "Submit"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div> 
    );
}
