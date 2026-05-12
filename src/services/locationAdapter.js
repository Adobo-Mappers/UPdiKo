/**
 * @typedef {Object} UnifiedLocation
 * @property {string} id
 * @property {number | null} recordId
 * @property {string} name
 * @property {number | null} latitude
 * @property {number | null} longitude
 * @property {string} address
 * @property {string[]} tags
 * @property {'OSM' | 'USER'} source
 * @property {string} locationType
 * @property {string[]} openingHours
 * @property {string[]} contactInfo
 * @property {string[]} images
 * @property {string | null} imageUrl
 * @property {string | null} description
 * @property {object} rawData
 */

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * @param {Record<string, any>} location
 * @returns {UnifiedLocation}
 */
export function normalizeOpenStreetLocation(location) {
  return {
    id: `osm-${location.id}`,
    recordId: toNumber(location.id),
    name: location.name || 'Unknown Location',
    latitude: toNumber(location.latitude),
    longitude: toNumber(location.longitude),
    address: location.address || 'Miagao, Iloilo',
    tags: Array.isArray(location.tags) ? location.tags : [],
    source: 'OSM',
    locationType: location.location_type || 'community',
    openingHours: Array.isArray(location.opening_hours) ? location.opening_hours : [],
    contactInfo: Array.isArray(location.contact_info) ? location.contact_info : [],
    images: Array.isArray(location.images) ? location.images : [],
    imageUrl: null,
    description: typeof location.additional_info === 'string' ? location.additional_info : null,
    rawData: location,
  };
}

/**
 * @param {Record<string, any>} location
 * @returns {UnifiedLocation}
 */
export function normalizeUserLocation(location) {
  return {
    id: `user-${location.id}`,
    recordId: null,
    name: location.locationName || location.location_name || 'Custom Pin',
    latitude: toNumber(location.latitude),
    longitude: toNumber(location.longitude),
    address: location.address || 'Miagao, Iloilo',
    tags: Array.isArray(location.tags) ? location.tags : ['custom'],
    source: 'USER',
    locationType: 'custom',
    openingHours: [],
    contactInfo: [],
    images: location.imageUrl ? [location.imageUrl] : [],
    imageUrl: location.imageUrl || null,
    description: location.description || null,
    rawData: location,
  };
}

/**
 * @param {Array<Record<string, any>>} publicLocations
 * @param {Array<Record<string, any>>} userLocations
 * @returns {UnifiedLocation[]}
 */
export function createUnifiedLocations(publicLocations = [], userLocations = []) {
  return [
    ...publicLocations.map(normalizeOpenStreetLocation),
    ...userLocations.map(normalizeUserLocation),
  ];
}
