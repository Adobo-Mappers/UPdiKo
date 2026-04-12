const db = require('./database');

const fetchOSMLocations = async () => {

  // Query 1: nodes (have direct lat/lon)
  const nodeQuery = `
    [out:json][timeout:60];
    area[name="Miagao"]->.searchArea;
    (
      node["amenity"](area.searchArea);
      node["shop"](area.searchArea);
      node["tourism"](area.searchArea);
    );
    out body;
  `;

  // Query 2: ways and relations (need center)
  const wayQuery = `
    [out:json][timeout:60];
    area[name="Miagao"]->.searchArea;
    (
      way["amenity"](area.searchArea);
      way["shop"](area.searchArea);
      way["tourism"](area.searchArea);
      relation["amenity"](area.searchArea);
      relation["shop"](area.searchArea);
      relation["tourism"](area.searchArea);
    );
    out center;
  `;

  const [nodeRes, wayRes] = await Promise.all([
    fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: nodeQuery }),
    fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: wayQuery }),
  ]);

  const nodeText = await nodeRes.text();
  const wayText = await wayRes.text();

  if (nodeText.startsWith("<") || wayText.startsWith("<")) {
    throw new Error("Overpass API returned XML — likely rate limited");
  }

  const nodeData = JSON.parse(nodeText);
  const wayData = JSON.parse(wayText);

  const allElements = [...nodeData.elements, ...wayData.elements];
  const named = allElements.filter(el => el.tags?.name);

  console.log(`🌐 Nodes: ${nodeData.elements.length} | Ways/Relations: ${wayData.elements.length} | Named: ${named.length}`);
  return named;
};

const syncLocations = async () => {
  console.log("🔄 Starting OSM sync...");

  try {
    const elements = await fetchOSMLocations();
    console.log(`📦 Fetched ${elements.length} named locations from OSM`);

    let added = 0;
    let updated = 0;
    let unchanged = 0;
    let skipped = 0;

    for (const el of elements) {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;

      // Skip elements with no coordinates
      if (!lat || !lon) {
        console.log(`⚠️  Skipping: ${el.tags?.name}`);
        console.log(`   Type: ${el.type}`);
        console.log(`   el.lat: ${el.lat}`);
        console.log(`   el.lon: ${el.lon}`);
        console.log(`   el.center: ${JSON.stringify(el.center)}`);
        skipped++;
        continue;
      }

      const geom = JSON.stringify({
        type: "Point",
        coordinates: [lon, lat]  // GeoJSON is [lng, lat]
      });

      const name = el.tags?.name;
      const address = el.tags?.["addr:full"] || el.tags?.["addr:street"] || "Miagao, Iloilo";
      const type = el.tags?.amenity || el.tags?.shop || el.tags?.tourism || "unknown";
      const openingHours = JSON.stringify(el.tags?.opening_hours ? [el.tags.opening_hours] : []);
      const phone = JSON.stringify(el.tags?.phone ? [el.tags.phone] : []);
      const locationType = type === "university" || type === "school" || type === "college" ? "campus" : "community";
      const osmId = String(el.id);

      const existing = db.prepare(
        'SELECT * FROM openstreets_static_locations WHERE osm_id = ?'
      ).get(osmId);

      if (!existing) {
        db.prepare(`
          INSERT INTO openstreets_static_locations 
          (osm_id, name, latitude, longitude, address, tags, opening_hours, contact_info, location_type, services, images, additional_info, geom)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          osmId, name, lat, lon, address,
          JSON.stringify([type]), openingHours, phone,
          locationType, '[]', '[]', null, geom
        );
        console.log(`✅ Added: ${name} (${lat}, ${lon})`);
        added++;
      } else {
        const hasChanged =
          existing.name !== name ||
          existing.latitude !== lat ||
          existing.longitude !== lon ||
          existing.address !== address ||
          existing.location_type !== locationType;

        if (hasChanged) {
          db.prepare(`
            UPDATE openstreets_static_locations
            SET name = ?, latitude = ?, longitude = ?, address = ?, 
                tags = ?, opening_hours = ?, contact_info = ?, location_type = ?, geom = ?
            WHERE osm_id = ?
          `).run(
            name, lat, lon, address,
            JSON.stringify([type]), openingHours, phone,
            locationType, geom, osmId
          );
          console.log(`🔄 Updated: ${name}`);
          updated++;
        } else {
          unchanged++;
        }
      }
    }

    const summary = {
      added,
      updated,
      unchanged,
      skipped,
      total: elements.length,
      stored: added + updated + unchanged,
      timestamp: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO sync_metadata (synced_at, added, updated, unchanged, total)
      VALUES (?, ?, ?, ?, ?)
    `).run(summary.timestamp, added, updated, unchanged, elements.length);

    console.log("\n📊 Sync Summary:");
    console.log(`   Total from OSM:  ${summary.total}`);
    console.log(`   Added:           ${summary.added}`);
    console.log(`   Updated:         ${summary.updated}`);
    console.log(`   Unchanged:       ${summary.unchanged}`);
    console.log(`   Skipped (null):  ${summary.skipped}`);
    console.log(`   Stored in DB:    ${summary.stored}`);
    console.log("✅ Sync complete");

    return summary;

  } catch (error) {
    console.error("❌ Sync failed:", error);
    throw error;
  }
};

module.exports = { syncLocations };