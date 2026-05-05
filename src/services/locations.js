import { fetchJson } from './api.js';

const DB_NAME = 'updi_ko_cache';
const DB_VERSION = 1;
const STORE_NAME = 'locations';
const META_STORE = 'metadata';
const CACHE_DURATION_HOURS = 24;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const haversineDistanceKm = (lat1, lng1, lat2, lng2) => {
  const radiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radiusKm * c;
};

const openDB = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const saveLocationsToCache = async (locations) => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
    tx.objectStore(STORE_NAME).clear();

    locations.forEach((location) => {
      tx.objectStore(STORE_NAME).put(location);
    });

    tx.objectStore(META_STORE).put({
      key: 'last_sync',
      timestamp: Date.now(),
      count: locations.length,
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const loadLocationsFromCache = async () => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

const isCacheFresh = async () => {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction(META_STORE, 'readonly');
    const request = tx.objectStore(META_STORE).get('last_sync');

    request.onsuccess = () => {
      const metadata = request.result;

      if (!metadata) {
        resolve(false);
        return;
      }

      const ageInHours = (Date.now() - metadata.timestamp) / (1000 * 60 * 60);
      resolve(ageInHours < CACHE_DURATION_HOURS);
    };

    request.onerror = () => resolve(false);
  });
};

const parseRow = (row) => ({
  ...row,
  tags: Array.isArray(row.tags) ? row.tags : [],
  opening_hours: Array.isArray(row.opening_hours) ? row.opening_hours : [],
  contact_info: Array.isArray(row.contact_info) ? row.contact_info : [],
  services: Array.isArray(row.services)
    ? row.services
    : row.services && typeof row.services === 'object'
      ? Object.values(row.services).flat().filter(Boolean)
      : [],
  images: Array.isArray(row.images) ? row.images : [],
  geom:
    row.latitude && row.longitude
      ? {
          type: 'Point',
          coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)],
        }
      : null,
});

const fetchFromSupabase = async (supabase) => {
  const { data, error } = await supabase
    .from('openstreets_static_locations')
    .select(
      'id, name, tags, address, latitude, longitude, opening_hours, contact_info, services, images, additional_info, location_type'
    );

  if (error) {
    throw new Error(`Supabase fetch failed: ${error.message}`);
  }

  return data.map(parseRow);
};

/**
 * Returns cached or live public locations from the normalized OSM table.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<Array<Record<string, any>>>}
 */
export const getStaticLocations = async (supabase) => {
  try {
    const fresh = await isCacheFresh();

    if (fresh) {
      const cached = await loadLocationsFromCache();
      if (cached.length > 0) {
        return cached;
      }
    }

    if (!navigator.onLine) {
      const cached = await loadLocationsFromCache();
      return cached.length > 0 ? cached : [];
    }

    if (!supabase) {
      return loadLocationsFromCache();
    }

    const locations = await fetchFromSupabase(supabase);
    await saveLocationsToCache(locations);
    return locations;
  } catch (error) {
    console.error('Failed to load public locations:', error);

    try {
      const cached = await loadLocationsFromCache();
      return cached.length > 0 ? cached : [];
    } catch {
      return [];
    }
  }
};

/**
 * Requests pedestrian routing from the secure Express backend.
 *
 * @param {{ lat: number, lng: number }} start
 * @param {{ lat: number, lng: number }} end
 * @returns {Promise<{ coordinates: number[][], distanceMeters: number | null, durationMinutes: number | null }>}
 */
export const getRoute = async (start, end) =>
  fetchJson('/api/directions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startLat: start.lat,
      startLng: start.lng,
      endLat: end.lat,
      endLng: end.lng,
    }),
  });

export const getCacheStatus = async () => {
  try {
    const db = await openDB();

    const metadata = await new Promise((resolve) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const request = tx.objectStore(META_STORE).get('last_sync');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });

    const count = await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });

    return {
      cached: count > 0,
      count,
      lastSync: metadata ? new Date(metadata.timestamp).toISOString() : null,
      ageInHours: metadata
        ? ((Date.now() - metadata.timestamp) / (1000 * 60 * 60)).toFixed(1)
        : null,
      isFresh: metadata
        ? Date.now() - metadata.timestamp < CACHE_DURATION_HOURS * 60 * 60 * 1000
        : false,
    };
  } catch {
    return { cached: false, count: 0, lastSync: null, ageInHours: null, isFresh: false };
  }
};

export const matchLocation = (locations, searchTerm) => {
  const term = searchTerm.toLowerCase().trim();

  if (!term || !locations.length) {
    return null;
  }

  return (
    locations.find((location) => {
      const name = (location.name || '').toLowerCase();
      const tags = (location.tags || []).map((tag) => tag.toLowerCase());

      return (
        name === term ||
        name.includes(term) ||
        tags.some((tag) => tag.includes(term) || term.includes(tag))
      );
    }) || null
  );
};

export const queryLocations = (
  locations,
  { category = null, keyword = null, userLat = null, userLng = null, limit = 10 } = {}
) => {
  if (!Array.isArray(locations) || locations.length === 0) {
    return [];
  }

  const categoryTerm = category ? String(category).toLowerCase().trim() : null;
  const keywordTerm = keyword ? String(keyword).toLowerCase().trim() : null;
  const hasUserCoords = toNumber(userLat) !== null && toNumber(userLng) !== null;

  const results = locations
    .filter((location) => {
      const name = String(location.name || '').toLowerCase();
      const tags = Array.isArray(location.tags)
        ? location.tags.map((tag) => String(tag).toLowerCase())
        : [];

      const categoryMatches =
        !categoryTerm || tags.some((tag) => tag.includes(categoryTerm));
      const keywordMatches =
        !keywordTerm ||
        name.includes(keywordTerm) ||
        tags.some((tag) => tag.includes(keywordTerm));

      return categoryMatches && keywordMatches;
    })
    .map((location) => {
      if (!hasUserCoords) {
        return location;
      }

      const latitude = toNumber(location.latitude);
      const longitude = toNumber(location.longitude);

      if (latitude === null || longitude === null) {
        return location;
      }

      return {
        ...location,
        distance: haversineDistanceKm(toNumber(userLat), toNumber(userLng), latitude, longitude),
      };
    });

  if (hasUserCoords) {
    results.sort((left, right) => {
      const leftDistance =
        typeof left.distance === 'number' ? left.distance : Number.POSITIVE_INFINITY;
      const rightDistance =
        typeof right.distance === 'number' ? right.distance : Number.POSITIVE_INFINITY;
      return leftDistance - rightDistance;
    });
  }

  return results.slice(0, limit);
};

export const getNearbyLocations = async (lat, lng, radius = 5, options = {}) => {
  try {
    const latitude = toNumber(lat);
    const longitude = toNumber(lng);
    const radiusKm = toNumber(radius) ?? 5;

    if (latitude === null || longitude === null || radiusKm <= 0) {
      return [];
    }

    let sourceLocations = Array.isArray(options.locations) ? options.locations : null;
    if (!sourceLocations || sourceLocations.length === 0) {
      sourceLocations = await getStaticLocations(options.supabase);
    }

    return sourceLocations
      .map((location) => {
        const locationLat = toNumber(location.latitude);
        const locationLng = toNumber(location.longitude);

        if (locationLat === null || locationLng === null) {
          return null;
        }

        const distance = haversineDistanceKm(latitude, longitude, locationLat, locationLng);
        if (distance > radiusKm) {
          return null;
        }

        return { ...location, distance };
      })
      .filter(Boolean)
      .sort((left, right) => left.distance - right.distance);
  } catch (error) {
    console.error('Error computing nearby locations:', error);
    return [];
  }
};
