const db = require('./database');

const fetchOSMLocations = async () => {
  const query = `
    [out:json][timeout:25];
    area[name="Miagao"]->.searchArea;
    (
      node["amenity"](area.searchArea);
      node["shop"](area.searchArea);
      node["tourism"](area.searchArea);
      way["amenity"](area.searchArea);
      way["shop"](area.searchArea);
      way["tourism"](area.searchArea);
      relation["amenity"](area.searchArea);
      relation["shop"](area.searchArea);
      relation["tourism"](area.searchArea);
    );
    out center;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  });

  const data = await response.json();
  return data.elements.filter(el => el.tags?.name);
};

const syncLocations = async () => {
  console.log("🔄 Starting OSM sync...");

  try {
    const elements = await fetchOSMLocations();
    console.log(`📦 Fetched ${elements.length} named locations from OSM`);

    let added = 0;
    let updated = 0;
    let unchanged = 0;

    for (const el of elements) {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const name = el.tags?.name;
      const address = el.tags?.["addr:full"] || el.tags?.["addr:street"] || "Miagao, Iloilo";
      const type = el.tags?.amenity || el.tags?.shop || el.tags?.tourism || "unknown";
      const openingHours = JSON.stringify(el.tags?.opening_hours ? [el.tags.opening_hours] : []);
      const phone = JSON.stringify(el.tags?.phone ? [el.tags.phone] : []);
      const locationType = type === "university" || type === "school" || type === "college" ? "campus" : "community";
      const osmId = String(el.id);

      // Check if location already exists by osm_id
      const existing = db.prepare(
        'SELECT * FROM openstreets_static_locations WHERE osm_id = ?'
      ).get(osmId);

      if (!existing) {
        // INSERT new location
        db.prepare(`
          INSERT INTO openstreets_static_locations 
          (osm_id, name, latitude, longitude, address, tags, opening_hours, contact_info, location_type, services, images, additional_info)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          osmId, name, lat, lon, address,
          JSON.stringify([type]), openingHours, phone,
          locationType, '[]', '[]', null
        );
        added++;
      } else {
        // Check if anything changed
        const hasChanged =
          existing.name !== name ||
          existing.latitude !== lat ||
          existing.longitude !== lon ||
          existing.address !== address ||
          existing.location_type !== locationType;

        if (hasChanged) {
          // UPDATE existing location
          db.prepare(`
            UPDATE openstreets_static_locations
            SET name = ?, latitude = ?, longitude = ?, address = ?, 
                tags = ?, opening_hours = ?, contact_info = ?, location_type = ?
            WHERE osm_id = ?
          `).run(
            name, lat, lon, address,
            JSON.stringify([type]), openingHours, phone,
            locationType, osmId
          );
          updated++;
        } else {
          unchanged++;
        }
      }
    }

    // Log sync result
    const summary = {
      added,
      updated,
      unchanged,
      total: elements.length,
      timestamp: new Date().toISOString()
    };

    // Save last sync info to a metadata table
    db.prepare(`
      INSERT INTO sync_metadata (synced_at, added, updated, unchanged, total)
      VALUES (?, ?, ?, ?, ?)
    `).run(summary.timestamp, added, updated, unchanged, elements.length);

    console.log("✅ Sync complete:", summary);
    return summary;

  } catch (error) {
    console.error("❌ Sync failed:", error);
    throw error;
  }
};

module.exports = { syncLocations };