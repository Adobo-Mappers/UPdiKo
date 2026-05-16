import { supabase } from './supabase.js';

/**
 * Loads reviews for a public OSM-backed location.
 *
 * @param {number} locationId
 * @returns {Promise<Array<Record<string, any>>>}
 */
export async function getLocationReviews(locationId) {
  const { data, error } = await supabase
    .from('location_reviews')
    .select('id, location_id, user_id, reviewer_name, rating, comment, created_at, updated_at')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((review) => ({
    ...review,
    userName: review.reviewer_name || 'Anonymous',
  }));
}

/**
 * Creates or updates the current user's review for a location.
 *
 * @param {{ locationId: number, userId: string, userName: string, rating: number, comment: string }} review
 * @returns {Promise<void>}
 */
export async function submitLocationReview(review) {
  const { error } = await supabase.from('location_reviews').upsert(
    [
      {
        location_id: review.locationId,
        user_id: review.userId,
        reviewer_name: review.userName,
        rating: review.rating,
        comment: review.comment,
      },
    ],
    { onConflict: 'location_id,user_id' }
  );

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Loads the review for a public OSM-backed location for a userID.
 *
 * @param {number} locationId
 * @param {string} userId
 * @returns {number}
 */
export async function getLocationReviewOfUser(locationId, userId) {
  const { data, error } = await supabase
    .from('location_reviews')
    .select('id, location_id, user_id, reviewer_name, rating, comment, created_at, updated_at')
    .eq('location_id', locationId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data && data[0].rating) || 0);
}