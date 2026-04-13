const express = require('express');
const cors = require('cors');
const db = require('./database');
const { syncLocations } = require('./sync');
const casieRoutes = require('./gemini');
const app = express();

app.use(cors());
app.use(express.json());

// Mount Casie AI routes at /api/cassie
app.use('/api/cassie', casieRoutes);

// GET all locations
app.get('/api/locations', (req, res) => {
  const locations = db.prepare('SELECT * FROM openstreets_static_locations').all();
  res.json(locations);
});

// GET nearby locations within radius (km)
app.get('/api/locations/nearby', (req, res) => {
  const { lat, lng, radius = 5 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }
  
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const radiusNum = parseFloat(radius);
  
  // Simple bounding box filter first (approximate)
  const latDelta = radiusNum / 111; // 1 degree ≈ 111km
  const lngDelta = radiusNum / (111 * Math.cos(latNum * Math.PI / 180));
  
  const locations = db.prepare(`
    SELECT * FROM openstreets_static_locations 
    WHERE latitude BETWEEN ? AND ?
    AND longitude BETWEEN ? AND ?
    AND name IS NOT NULL
  `).all(
    latNum - latDelta,
    latNum + latDelta,
    lngNum - lngDelta,
    lngNum + lngDelta
  );
  
  // Calculate actual distance and filter
  const R = 6371; // km
  const withDistance = locations.map(loc => {
    const dLat = (loc.latitude - latNum) * Math.PI / 180;
    const dLng = (loc.longitude - lngNum) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(latNum * Math.PI / 180) * Math.cos(loc.latitude * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return { ...loc, distance: R * c };
  }).filter(loc => loc.distance <= radiusNum)
    .sort((a, b) => a.distance - b.distance);
  
  res.json(withDistance);
});

// GET last sync info
app.get('/api/sync/status', (req, res) => {
  const last = db.prepare(
    'SELECT * FROM sync_metadata ORDER BY id DESC LIMIT 1'
  ).get();
  res.json(last || { message: "No sync has been run yet" });
});

// POST manually trigger a sync
app.post('/api/sync', async (req, res) => {
  try {
    const result = await syncLocations();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AUTO CHECKER: runs sync every 24 hours
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

const autoSync = async () => {
  try {
    const last = db.prepare(
      'SELECT * FROM sync_metadata ORDER BY id DESC LIMIT 1'
    ).get();

    if (!last) {
      console.log("⚡ No previous sync found, running initial sync...");
      await syncLocations();
      return;
    }

    const lastSyncTime = new Date(last.synced_at).getTime();
    const now = Date.now();
    const hoursSinceLastSync = (now - lastSyncTime) / (1000 * 60 * 60);

    if (hoursSinceLastSync >= 24) {
      console.log(`⏰ Last sync was ${hoursSinceLastSync.toFixed(1)} hours ago, syncing now...`);
      await syncLocations();
    } else {
      console.log(`✅ Last sync was ${hoursSinceLastSync.toFixed(1)} hours ago, no sync needed`);
    }
  } catch (error) {
    console.error("❌ Auto-sync failed:", error.message);
  }
};

// Run checker on server start
autoSync();

// Run checker every 24 hours
setInterval(autoSync, SYNC_INTERVAL_MS);

app.listen(3000, () => console.log('Server running on port 3000'));
