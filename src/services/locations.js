const BASE_URL = "http://localhost:3000/api";

export const getStaticLocations = async () => {
  try {
    const response = await fetch(`${BASE_URL}/locations`);
    if (!response.ok) {
      console.error("Error fetching static locations:", response.statusText);
      return [];
    }
    const data = await response.json();

    const parsed = data.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || "[]"),
      opening_hours: JSON.parse(row.opening_hours || "[]"),
      contact_info: JSON.parse(row.contact_info || "[]"),
      services: JSON.parse(row.services || "[]"),
      images: JSON.parse(row.images || "[]"),
      geom: row.geom ? JSON.parse(row.geom) : null,  // parse GeoJSON point
    }));

    // Debug print
    console.log(`📍 Total locations fetched from server: ${parsed.length}`);
    const withCoords = parsed.filter(r => r.latitude && r.longitude);
    const withGeom = parsed.filter(r => r.geom !== null);
    console.log(`   With lat/lng:    ${withCoords.length}`);
    console.log(`   With geom:       ${withGeom.length}`);
    console.log(`   Missing coords:  ${parsed.length - withCoords.length}`);

    return parsed;

  } catch (error) {
    console.error("Error fetching static locations:", error);
    return [];
  }
};

export const getRoute = async (startLat, startLng, endLat, endLng) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== "Ok") {
      console.error("OSRM routing failed:", data.message);
      return [];
    }

    const coords = data.routes[0].geometry.coordinates.map(
      ([lng, lat]) => [lat, lng]
    );

    return coords;

  } catch (error) {
    console.error("Failed to fetch route:", error);
    return [];
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

export const getNearbyLocations = async (lat, lng, radius = 5) => {
  try {
    const response = await fetch(`${BASE_URL}/locations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    if (!response.ok) {
      console.error("Error fetching nearby locations:", response.statusText);
      return [];
    }
    const data = await response.json();

    const parsed = data.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || "[]"),
      opening_hours: JSON.parse(row.opening_hours || "[]"),
      contact_info: JSON.parse(row.contact_info || "[]"),
      services: JSON.parse(row.services || "[]"),
      images: JSON.parse(row.images || "[]"),
    }));

    return parsed;
  } catch (error) {
    console.error("Error fetching nearby locations:", error);
    return [];
  }
};