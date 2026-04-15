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
