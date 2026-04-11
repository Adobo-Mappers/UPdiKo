// services/locations.js
const BASE_URL = "http://localhost:3000/api";

export const getStaticLocations = async () => {
  try {
    const response = await fetch(`${BASE_URL}/locations`);
    if (!response.ok) {
      console.error("Error fetching static locations:", response.statusText);
      return [];
    }
    const data = await response.json();

    // Parse JSON strings back into arrays since SQLite doesn't support arrays
    return data.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || "[]"),
      opening_hours: JSON.parse(row.opening_hours || "[]"),
      contact_info: JSON.parse(row.contact_info || "[]"),
      services: JSON.parse(row.services || "[]"),
      images: JSON.parse(row.images || "[]"),
    }));
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

    // Convert [lng, lat] to Leaflet's [lat, lng]
    const coords = data.routes[0].geometry.coordinates.map(
      ([lng, lat]) => [lat, lng]
    );

    return coords;

  } catch (error) {
    console.error("Failed to fetch route:", error);
    return [];
  }
};