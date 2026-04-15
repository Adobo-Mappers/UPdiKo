const DB_NAME = "updi_ko_cache";
const DB_VERSION = 1;
const STORE_NAME = "locations";
const META_STORE = "metadata";
const CACHE_DURATION_HOURS = 24;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const haversineDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ============================================================
// OPEN DATABASE
// Opens (or creates) the IndexedDB database
// ============================================================
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store for location rows
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }

      // Store for sync metadata (last sync time etc)
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// ============================================================
// SAVE LOCATIONS TO INDEXEDDB
// Clears old data and writes fresh rows
// ============================================================
const saveLocationsToCache = async (locations) => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE], "readwrite");

    // Clear old locations
    tx.objectStore(STORE_NAME).clear();

    // Write each location
    locations.forEach(loc => {
      tx.objectStore(STORE_NAME).put(loc);
    });

    // Save sync timestamp
    tx.objectStore(META_STORE).put({
      key: "last_sync",
      timestamp: Date.now(),
      count: locations.length,
    });

    tx.oncomplete = () => {
      console.log(`💾 Cached ${locations.length} locations to IndexedDB`);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
};

// ============================================================
// LOAD LOCATIONS FROM INDEXEDDB
// Returns all cached rows, or empty array
// ============================================================
const loadLocationsFromCache = async () => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// ============================================================
// CHECK IF CACHE IS FRESH
// Returns true if cache is less than 24 hours old
// ============================================================
const isCacheFresh = async () => {
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction(META_STORE, "readonly");
    const request = tx.objectStore(META_STORE).get("last_sync");

    request.onsuccess = () => {
      const meta = request.result;
      if (!meta) return resolve(false);

      const ageInHours = (Date.now() - meta.timestamp) / (1000 * 60 * 60);
      const fresh = ageInHours < CACHE_DURATION_HOURS;
      console.log(`🕐 Cache age: ${ageInHours.toFixed(1)}h — ${fresh ? "FRESH" : "STALE"}`);
      resolve(fresh);
    };

    request.onerror = () => resolve(false);
  });
};

// ============================================================
// PARSE ROW
// Converts raw Supabase row into usable JS object
// Arrays are already arrays from Supabase (PostgreSQL)
// ============================================================
const parseRow = (row) => ({
  ...row,
  tags: Array.isArray(row.tags) ? row.tags : [],
  opening_hours: Array.isArray(row.opening_hours) ? row.opening_hours : [],
  contact_info: Array.isArray(row.contact_info) ? row.contact_info : [],
  services: Array.isArray(row.services) ? row.services : [],
  images: Array.isArray(row.images) ? row.images : [],
  // Build GeoJSON point from lat/lng for AI/spatial use
  geom: (row.latitude && row.longitude) ? {
    type: "Point",
    coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)]
  } : null,
});

// ============================================================
// FETCH FROM SUPABASE
// Pulls all locations from the openstreets table
// ============================================================
const fetchFromSupabase = async (supabase) => {
  console.log("🌐 Fetching locations from Supabase...");

  const { data, error } = await supabase
    .from("openstreets_static_locations")
    .select("id, name, tags, address, latitude, longitude, opening_hours, contact_info, services, images, additional_info, location_type");

  if (error) throw new Error(`Supabase fetch failed: ${error.message}`);

  return data.map(parseRow);
};

// ============================================================
// GET STATIC LOCATIONS
// Flow:
//   Online + cache fresh  → return cache (no network)
//   Online + cache stale  → fetch Supabase, update cache, return fresh data
//   Offline + cache exists → return cache with offline warning
//   Offline + no cache    → return empty array with error
// ============================================================
export const getStaticLocations = async (supabase) => {
  try {
    const fresh = await isCacheFresh();

    if (fresh) {
      const cached = await loadLocationsFromCache();
      if (cached.length > 0) {
        console.log(`📦 Serving ${cached.length} locations from cache`);
        return cached;
      }
    }

    if (!navigator.onLine) {
      console.warn("📴 Offline — attempting to serve stale cache");
      const cached = await loadLocationsFromCache();
      if (cached.length > 0) {
        console.log(`📦 Serving ${cached.length} stale locations (offline)`);
        return cached;
      }
      console.error("❌ Offline and no cache available");
      return [];
    }

    if (!supabase) {
      console.warn("⚠️ No Supabase client provided — serving cache only");
      const cached = await loadLocationsFromCache();
      return cached;
    }

    // Online and cache is stale or empty — fetch fresh data
    const locations = await fetchFromSupabase(supabase);
    await saveLocationsToCache(locations);

    console.log(`✅ Fetched and cached ${locations.length} locations`);
    return locations;

  } catch (error) {
    console.error("❌ getStaticLocations failed:", error);

    // Last resort: try to serve stale cache
    try {
      const cached = await loadLocationsFromCache();
      if (cached.length > 0) {
        console.warn(`⚠️ Serving ${cached.length} stale locations due to error`);
        return cached;
      }
    } catch {
      // Cache also failed
    }

    return [];
  }
};

// ============================================================
// GET ROUTING
// Gets the routing for the selected location from user location
// ============================================================
export const getRoute = async (startLat, startLng, endLat, endLng) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== "Ok") {
      console.error("OSRM routing failed:", data.message);
      return [];
    }

    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } catch (error) {
    console.error("Failed to fetch route:", error);
    return [];
  }
};

// ============================================================
// CACHE STATUS (for debugging/admin UI)
// Returns info about current cache state
// ============================================================
export const getCacheStatus = async () => {
  try {
    const db = await openDB();
    const meta = await new Promise((resolve) => {
      const tx = db.transaction(META_STORE, "readonly");
      const req = tx.objectStore(META_STORE).get("last_sync");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    const count = await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });

    return {
      cached: count > 0,
      count,
      lastSync: meta ? new Date(meta.timestamp).toISOString() : null,
      ageInHours: meta ? ((Date.now() - meta.timestamp) / (1000 * 60 * 60)).toFixed(1) : null,
      isFresh: meta ? (Date.now() - meta.timestamp) < (CACHE_DURATION_HOURS * 60 * 60 * 1000) : false,
    };
  } catch {
    return { cached: false, count: 0, lastSync: null, ageInHours: null, isFresh: false };
  }
};

export const matchLocation = (locations, searchTerm) => {
  const term = searchTerm.toLowerCase().trim();
  if (!term || !locations.length) return null;
  
  return locations.find(loc => {
    const name = (loc.name || '').toLowerCase();
    const tags = (loc.tags || []).map(t => t.toLowerCase());
    
    if (name === term) return true;
    if (name.includes(term)) return true;
    if (tags.some(tag => tag.includes(term) || term.includes(tag))) return true;
    return false;
  }) || null;
};

export const queryLocations = (
  locations,
  { category = null, keyword = null, userLat = null, userLng = null, limit = 10 } = {}
) => {
  if (!Array.isArray(locations) || locations.length === 0) return [];

  const categoryTerm = category ? String(category).toLowerCase().trim() : null;
  const keywordTerm = keyword ? String(keyword).toLowerCase().trim() : null;
  const hasUserCoords = toNumber(userLat) !== null && toNumber(userLng) !== null;

  const results = locations
    .filter((loc) => {
      const name = String(loc.name || "").toLowerCase();
      const tags = Array.isArray(loc.tags)
        ? loc.tags.map((tag) => String(tag).toLowerCase())
        : [];

      const categoryOk =
        !categoryTerm || tags.some((tag) => tag.includes(categoryTerm));

      const keywordOk =
        !keywordTerm ||
        name.includes(keywordTerm) ||
        tags.some((tag) => tag.includes(keywordTerm));

      return categoryOk && keywordOk;
    })
    .map((loc) => {
      if (!hasUserCoords) return loc;

      const lat = toNumber(loc.latitude);
      const lng = toNumber(loc.longitude);
      if (lat === null || lng === null) return loc;

      return {
        ...loc,
        distance: haversineDistanceKm(toNumber(userLat), toNumber(userLng), lat, lng),
      };
    });

  if (hasUserCoords) {
    results.sort((a, b) => {
      const aDistance = typeof a.distance === "number" ? a.distance : Number.POSITIVE_INFINITY;
      const bDistance = typeof b.distance === "number" ? b.distance : Number.POSITIVE_INFINITY;
      return aDistance - bDistance;
    });
  }

  return results.slice(0, limit);
};

export const getNearbyLocations = async (lat, lng, radius = 5, options = {}) => {
  try {
    const latNum = toNumber(lat);
    const lngNum = toNumber(lng);
    const radiusNum = toNumber(radius) ?? 5;

    if (latNum === null || lngNum === null || radiusNum <= 0) return [];

    let sourceLocations = Array.isArray(options.locations) ? options.locations : null;
    if (!sourceLocations || sourceLocations.length === 0) {
      sourceLocations = await getStaticLocations(options.supabase);
    }

    return sourceLocations
      .map((loc) => {
        const locLat = toNumber(loc.latitude);
        const locLng = toNumber(loc.longitude);
        if (locLat === null || locLng === null) return null;

        const distance = haversineDistanceKm(latNum, lngNum, locLat, locLng);
        if (distance > radiusNum) return null;

        return { ...loc, distance };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error("Error computing nearby locations:", error);
    return [];
  }
};