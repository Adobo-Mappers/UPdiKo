import { LOCATION_IMAGE_BUCKET, supabase } from './supabase.js';

/**
 * Uploads a personal pin image to the existing public storage bucket.
 *
 * @param {File} file
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function uploadPinImage(file, userId) {
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `${userId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(LOCATION_IMAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || 'Image upload failed.');
  }

  const { data } = supabase.storage.from(LOCATION_IMAGE_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}
