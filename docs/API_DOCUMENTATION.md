# UPdiKo API Documentation

> **Last Updated:** April 2026  
> **Version:** 1.0.0  
> **Base URL:** `http://localhost:3000`

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Architecture](#2-architecture)
3. [API Endpoints](#3-api-endpoints)
4. [Internal Functions](#4-internal-functions)
5. [Database Schema](#5-database-schema)
6. [Authentication](#6-authentication)
7. [Error Handling](#7-error-handling)
8. [Rate Limits](#8-rate-limits)
9. [Code Examples](#9-code-examples)

---

## 1. Getting Started

### 1.1 Prerequisites

Before making API calls, ensure you have:

- **Node.js** (v14 or higher) installed
- **npm** package manager
- A running Express server on `http://localhost:3000`

### 1.2 Quick Start Tutorial

#### Step 1: Install Dependencies and Start Server

```bash
cd server
npm install
node index.js
```

You should see output similar to:
```
⚡ No previous sync found, running initial sync...
🔄 Starting OSM sync...
📦 Fetched 50 named locations from OSM
✅ Sync complete: { added: 50, updated: 0, unchanged: 0, total: 50 }
Server running on port 3000
```

#### Step 2: Make Your First API Call

**Fetch all locations:**
```javascript
const response = await fetch('http://localhost:3000/api/locations');
const locations = await response.json();
console.log('Found', locations.length, 'locations');
```

**Response:**
```json
[
  {
    "id": 1,
    "osm_id": "123456789",
    "name": "UP Miagao Campus",
    "latitude": 10.6419,
    "longitude": 122.0759,
    "address": "Miagao, Iloilo",
    "tags": "[\"education\"]",
    "opening_hours": "[\"7:00 AM - 5:00 PM\"]",
    "contact_info": "[\"+63 33 123 4567\"]",
    "location_type": "campus",
    "services": "[]",
    "images": "[]",
    "additional_info": null
  }
]
```

#### Step 3: Check Sync Status

```javascript
const response = await fetch('http://localhost:3000/api/sync/status');
const status = await response.json();
console.log('Last sync:', status.synced_at);
```

#### Step 4: Trigger Manual Sync

```javascript
const response = await fetch('http://localhost:3000/api/sync', {
  method: 'POST'
});
const result = await response.json();
console.log('Sync result:', result);
```

---

## 2. Architecture

### 2.1 System Overview

The UPdiKo backend consists of three main files:

```
server/
├── index.js      # Express server - API endpoints
├── database.js   # SQLite database initialization
└── sync.js       # OpenStreetMap synchronization
```

### 2.2 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Express Server (index.js)                   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ GET /locations│  │ GET /sync   │  │ POST /sync          │  │
│  │              │  │   /status    │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              SQLite Database (database.js)                  ││
│  │                                                              ││
│  │  Tables:                                                    ││
│  │  - openstreets_static_locations                            ││
│  │  - sync_metadata                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              OSM Sync Service (sync.js)                    ││
│  │                                                              ││
│  │  - fetchOSMLocations() - Fetches from Overpass API        ││
│  │  - syncLocations() - Syncs data to database                ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              OpenStreetMap Overpass API                     ││
│  │              https://overpass-api.de/api/interpreter       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Automatic Sync Behavior

The server includes automatic synchronization:

```javascript
// From index.js - Auto sync runs:
// 1. On server startup (if no previous sync exists)
// 2. Every 24 hours via setInterval
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
```

---

## 3. API Endpoints

### 3.1 Casie AI Chatbot Endpoints

The Casie AI chatbot provides conversational location search using Google Gemini.

#### 3.1.1 POST /api/cassie

Send a message to the Casie AI assistant.

**Endpoint:**
```
POST http://localhost:3000/api/cassie
```

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `X-Gemini-Key` | Yes | Google Gemini API key |

**Request Body:**
```json
{
  "message": "Find restaurants near the campus",
  "context": {
    "currentPage": "MAP",
    "userLocation": {
      "lat": 10.6419,
      "lng": 122.0759
    }
  },
  "sessionId": "optional-uuid-for-continuity"
}
```

**Parameters:**
| Field | Type | Required | Description |
|------|------|----------|-------------|
| `message` | string | Yes | User's input message |
| `context` | object | No | Current app state |
| `context.currentPage` | string | No | Current page (HOME, MAP, etc.) |
| `context.selectedLocation` | object | No | Selected location |
| `context.userLocation` | object | No | User's GPS coordinates |
| `sessionId` | string | No | UUID for conversation continuity |

**Response (200 OK):**
```json
{
  "message": "I found some great restaurants near the campus! Here are a few options...",
  "places": [
    {
      "name": "Kusina ni Co",
      "address": "Miagao, Iloilo",
      "lat": 10.6425,
      "lng": 122.0762
    }
  ],
  "sessionId": "uuid-continues-here"
}
```

**Response Schema:**
| Field | Type | Description |
|------|------|-------------|
| `message` | string | AI's conversational response |
| `places` | array | Location results (if any) |
| `places[].name` | string | Location name |
| `places[].address` | string | Location address |
| `places[].lat` | number | Latitude |
| `places[].lng` | number | Longitude |
| `sessionId` | string | Session ID for next message |

**Error Responses:**
- `400`: Missing message or API key
- `500`: Gemini API error

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/cassie \
  -H "Content-Type: application/json" \
  -H "X-Gemini-Key: YOUR_API_KEY" \
  -d '{"message": "Where is the library?"}'
```

---

#### 3.1.2 POST /api/cassie/clear

Clear conversation history for a session.

**Endpoint:**
```
POST http://localhost:3000/api/cassie/clear
```

**Request Body:**
```json
{
  "sessionId": "uuid-to-clear"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Conversation cleared for session"
}
```

---

#### 3.1.3 GET /api/cassie/history

Get conversation history for a session.

**Endpoint:**
```
GET http://localhost:3000/api/cassie/history?sessionId=uuid
```

**Response (200 OK):**
```json
{
  "history": [
    { "role": "user", "parts": [{ "text": "Find restaurants" }] },
    { "role": "model", "parts": [{ "text": "Here are some options..." }] }
  ]
}
```

---

### 3.2 GET /api/locations

Retrieve all locations from the SQLite database.

**Endpoint:**
```
GET http://localhost:3000/api/locations
```

**Parameters:** None (no query parameters, path parameters, or request body)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "osm_id": "123456789",
    "name": "UP Miagao Campus",
    "latitude": 10.6419,
    "longitude": 122.0759,
    "address": "Miagao, Iloilo",
    "tags": "[\"education\"]",
    "opening_hours": "[\"7:00 AM - 5:00 PM\"]",
    "contact_info": "[\"+63 33 123 4567\"]",
    "location_type": "campus",
    "services": "[]",
    "images": "[]",
    "additional_info": null
  },
  {
    "id": 2,
    "osm_id": "987654321",
    "name": "Miagao Public Market",
    "latitude": 10.6425,
    "longitude": 122.0765,
    "address": "Poblacion, Miagao, Iloilo",
    "tags": "[\"market\"]",
    "opening_hours": "[\"5:00 AM - 6:00 PM\"]",
    "contact_info": "[]",
    "location_type": "community",
    "services": "[\"fresh produce\"]",
    "images": "[]",
    "additional_info": null
  }
]
```

**Response Schema - Location:**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | integer | Primary key, auto-increment | `1` |
| `osm_id` | string | OpenStreetMap feature ID | `"123456789"` |
| `name` | string | Location name | `"UP Miagao Campus"` |
| `latitude` | number | Geographic latitude | `10.6419` |
| `longitude` | number | Geographic longitude | `122.0759` |
| `address` | string | Full address | `"Miagao, Iloilo"` |
| `tags` | string | JSON array of category tags | `"[\"education\"]"` |
| `opening_hours` | string | JSON array of operating hours | `"[\"7:00 AM - 5:00 PM\"]"` |
| `contact_info` | string | JSON array of contact info | `"[\"+63 33 123 4567\"]"` |
| `location_type` | string | "campus" or "community" | `"campus"` |
| `services` | string | JSON array of services | `"[]"` |
| `images` | string | JSON array of image URLs | `"[]"` |
| `additional_info` | string/null | Additional metadata | `null` |

**Error Responses:**
- `500 Internal Server Error`: Database query failed

---

### 3.2 GET /api/sync/status

Check the status of the last OpenStreetMap synchronization.

**Endpoint:**
```
GET http://localhost:3000/api/sync/status
```

**Parameters:** None

**Response (200 OK - Previous Sync Exists):**
```json
{
  "id": 1,
  "synced_at": "2026-04-10T12:00:00.000Z",
  "added": 5,
  "updated": 2,
  "unchanged": 143,
  "total": 150
}
```

**Response (200 OK - No Previous Sync):**
```json
{
  "message": "No sync has been run yet"
}
```

**Response Schema - Sync Metadata:**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | integer | Primary key | `1` |
| `synced_at` | string | ISO 8601 timestamp | `"2026-04-10T12:00:00.000Z"` |
| `added` | integer | New locations added | `5` |
| `updated` | integer | Existing locations updated | `2` |
| `unchanged` | integer | Unchanged locations | `143` |
| `total` | integer | Total locations in database | `150` |

**Error Responses:**
- `500 Internal Server Error`: Database query failed

---

### 3.3 POST /api/sync

Manually trigger an OpenStreetMap data synchronization.

**Endpoint:**
```
POST http://localhost:3000/api/sync
```

**Parameters:** None (empty request body)

**Request Body:** Empty (no JSON required)

**Response (200 OK):**
```json
{
  "success": true,
  "result": {
    "added": 5,
    "updated": 2,
    "unchanged": 143,
    "total": 150,
    "timestamp": "2026-04-11T10:30:00.000Z"
  }
}
```

**Response Schema - Sync Result:**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `success` | boolean | Indicates success | `true` |
| `result.added` | integer | New locations inserted | `5` |
| `result.updated` | integer | Existing locations modified | `2` |
| `result.unchanged` | integer | Unchanged locations | `143` |
| `result.total` | integer | Total locations processed | `150` |
| `result.timestamp` | string | ISO 8601 completion time | `"2026-04-11T10:30:00.000Z"` |

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to fetch from Overpass API"
}
```

---

## 4. Internal Functions

These functions are used internally by the server and are not exposed as HTTP endpoints.

### 4.1 fetchOSMLocations()

Fetches location data from the OpenStreetMap Overpass API.

**File:** `server/sync.js`

**Function Signature:**
```javascript
const fetchOSMLocations = async () => { ... }
```

**Returns:** `Promise<Array>` - Array of OSM elements with names

**Process:**
1. Sends a POST request to `https://overpass-api.de/api/interpreter`
2. Queries for amenities, shops, and tourism points in Miagao area
3. Filters elements to only include those with names

**Overpass Query:**
```javascript
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
```

**Data Extracted:**
| Field | Source | Description |
|-------|--------|-------------|
| `lat` | `el.lat` or `el.center.lat` | Latitude |
| `lon` | `el.lon` or `el.center.lon` | Longitude |
| `name` | `el.tags.name` | Location name |
| `address` | `el.tags["addr:full"]` or `el.tags["addr:street"]` | Address |
| `type` | `el.tags.amenity` or `el.tags.shop` or `el.tags.tourism` | Category |
| `opening_hours` | `el.tags.opening_hours` | Operating hours |
| `phone` | `el.tags.phone` | Contact phone |

---

### 4.2 syncLocations()

Main synchronization function that fetches OSM data and updates the SQLite database.

**File:** `server/sync.js`

**Function Signature:**
```javascript
const syncLocations = async () => { ... }
```

**Returns:** `Promise<Object>` - Sync summary object

**Process:**

1. **Fetch Data** - Calls `fetchOSMLocations()` to get OSM elements

2. **Process Each Location:**
   ```javascript
   for (const el of elements) {
     // Extract location data
     const lat = el.lat ?? el.center?.lat;
     const lon = el.lon ?? el.center?.lon;
     const name = el.tags?.name;
     const address = el.tags?.["addr:full"] || el.tags?.["addr:street"] || "Miagao, Iloilo";
     const type = el.tags?.amenity || el.tags?.shop || el.tags?.tourism || "unknown";
     
     // Determine location type
     const locationType = type === "university" || type === "school" || type === "college" 
       ? "campus" 
       : "community";
   }
   ```

3. **Database Operations:**
   - **INSERT** - If `osm_id` doesn't exist in database
   - **UPDATE** - If data has changed (name, lat, lon, address, or location_type)
   - **UNCHANGED** - If no changes detected

4. **Record Sync Metadata:**
   ```javascript
   db.prepare(`
     INSERT INTO sync_metadata (synced_at, added, updated, unchanged, total)
     VALUES (?, ?, ?, ?, ?)
   `).run(timestamp, added, updated, unchanged, elements.length);
   ```

**Returns:**
```javascript
{
  added: number,    // New locations inserted
  updated: number,  // Existing locations updated
  unchanged: number, // No changes detected
  total: number,    // Total elements fetched
  timestamp: string // ISO 8601 timestamp
}
```

---

### 4.3 autoSync()

Internal function that runs automatically on server startup and every 24 hours.

**File:** `server/index.js`

**Function:**
```javascript
const autoSync = async () => {
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
};
```

**Behavior:**
- If no previous sync exists → runs initial sync
- If last sync was > 24 hours ago → runs sync
- Otherwise → skips sync

---

## 5. Database Schema

### 5.1 Table: openstreets_static_locations

Stores all location data synced from OpenStreetMap.

**Creation SQL:**
```sql
CREATE TABLE IF NOT EXISTS openstreets_static_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  osm_id TEXT UNIQUE,
  name TEXT,
  latitude REAL,
  longitude REAL,
  address TEXT,
  tags TEXT,
  opening_hours TEXT,
  contact_info TEXT,
  location_type TEXT,
  services TEXT,
  images TEXT,
  additional_info TEXT
);
```

**Columns:**
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | INTEGER | Primary key | AUTOINCREMENT |
| `osm_id` | TEXT | OSM feature ID | UNIQUE |
| `name` | TEXT | Location name | |
| `latitude` | REAL | Latitude coordinate | |
| `longitude` | REAL | Longitude coordinate | |
| `address` | TEXT | Full address | |
| `tags` | TEXT | JSON array of tags | |
| `opening_hours` | TEXT | JSON array of hours | |
| `contact_info` | TEXT | JSON array of contacts | |
| `location_type` | TEXT | "campus" or "community" | |
| `services` | TEXT | JSON array of services | |
| `images` | TEXT | JSON array of image URLs | |
| `additional_info` | TEXT | Extra metadata | |

---

### 5.2 Table: sync_metadata

Stores synchronization history.

**Creation SQL:**
```sql
CREATE TABLE IF NOT EXISTS sync_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  synced_at TEXT,
  added INTEGER,
  updated INTEGER,
  unchanged INTEGER,
  total INTEGER
);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `synced_at` | TEXT | ISO 8601 timestamp |
| `added` | INTEGER | New locations added |
| `updated` | INTEGER | Locations updated |
| `unchanged` | INTEGER | Unchanged locations |
| `total` | INTEGER | Total locations processed |

---

## 6. Authentication

### 6.1 Express API (Backend)

The Express API endpoints **do not require authentication** (public endpoints):

| Endpoint | Method | Authentication Required |
|----------|--------|-------------------------|
| `/api/locations` | GET | No |
| `/api/sync/status` | GET | No |
| `/api/sync` | POST | No |

> **Note:** For production deployment, consider adding API key authentication.

### 6.2 Supabase (Frontend User Data)

User authentication and personal data are handled by Supabase on the frontend:

```javascript
import { createClient } from "@https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**Environment Variables Required:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 7. Error Handling

### 7.1 HTTP Status Codes

| Status Code | Meaning | Description |
|-------------|---------|-------------|
| `200` | OK | Request succeeded |
| `400` | Bad Request | Malformed request |
| `500` | Internal Server Error | Server-side error |

### 7.2 Error Response Format

All errors follow a consistent JSON format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### 7.3 Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `"Failed to fetch from Overpass API"` | Overpass API unavailable or timeout | Check internet, try again later |
| `"No sync has been run yet"` | Database empty, no prior sync | Call `POST /api/sync` |
| `"SQLITE_CANTOPEN: unable to open database file"` | Database file not found | Ensure `server/database.db` exists |

### 7.4 Error Handling in Code

```javascript
async function fetchLocations() {
  try {
    const response = await fetch('http://localhost:3000/api/locations');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error:', err.message);
    throw err;
  }
}
```

---

## 8. Rate Limits

### 8.1 Endpoint Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `GET /api/locations` | 100 requests | 1 minute |
| `GET /api/sync/status` | 60 requests | 1 minute |
| `POST /api/sync` | 10 requests | 1 minute |

### 8.2 Overpass API Limits

The Overpass API has its own rate limits:
- **Timeout:** 25 seconds per request
- **Recommended:** Do not exceed 1 sync per minute

### 8.3 Handling 429 (Rate Limited)

```javascript
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url);
    
    if (response.status === 429) {
      const waitTime = Math.pow(2, i) * 1000;
      console.log(`Rate limited. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    
    return response;
  }
  throw new Error('Max retries exceeded');
}
```

---

## 9. Code Examples

### 9.1 JavaScript - Fetch All Locations

```javascript
async function getLocations() {
  const response = await fetch('http://localhost:3000/api/locations');
  
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  
  return response.json();
}

// Usage
const locations = await getLocations();
console.log(`Found ${locations.length} locations`);

// Parse JSON fields
locations.forEach(loc => {
  console.log(loc.name, '- Tags:', JSON.parse(loc.tags));
});
```

### 9.2 JavaScript - Check Sync Status

```javascript
async function getSyncStatus() {
  const response = await fetch('http://localhost:3000/api/sync/status');
  return response.json();
}

// Usage
const status = await getSyncStatus();
if (status.message) {
  console.log(status.message);
} else {
  console.log(`Last sync: ${status.synced_at}`);
  console.log(`Total locations: ${status.total}`);
}
```

### 9.3 JavaScript - Trigger Manual Sync

```javascript
async function triggerSync() {
  const response = await fetch('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.result;
}

// Usage
const syncResult = await triggerSync();
console.log(`Added: ${syncResult.added}`);
console.log(`Updated: ${syncResult.updated}`);
console.log(`Total: ${syncResult.total}`);
```

### 9.4 cURL Examples

**Get all locations:**
```bash
curl -X GET http://localhost:3000/api/locations
```

**Get sync status:**
```bash
curl -X GET http://localhost:3000/api/sync/status
```

**Trigger manual sync:**
```bash
curl -X POST http://localhost:3000/api/sync
```

### 9.5 React Integration Example

```jsx
import { useState, useEffect } from 'react';

function LocationList() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/locations')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setLocations(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {locations.map(loc => (
        <li key={loc.id}>
          <strong>{loc.name}</strong> - {loc.address}
          <br />
          <small>Type: {loc.location_type}</small>
        </li>
      ))}
    </ul>
  );
}
```

### 9.6 Complete Sync Workflow

```javascript
async function initializeAndSync() {
  console.log('Checking sync status...');
  
  // Check last sync
  const statusRes = await fetch('http://localhost:3000/api/sync/status');
  const status = await statusRes.json();
  
  if (status.message === 'No sync has been run yet') {
    console.log('No previous sync. Triggering initial sync...');
    const syncRes = await fetch('http://localhost:3000/api/sync', {
      method: 'POST'
    });
    const syncResult = await syncRes.json();
    console.log('Initial sync complete:', syncResult.result);
  } else {
    console.log('Last sync:', status.synced_at);
    console.log('Total locations:', status.total);
  }
  
  // Fetch locations
  const locationsRes = await fetch('http://localhost:3000/api/locations');
  const locations = await locationsRes.json();
  console.log(`Loaded ${locations.length} locations`);
  
  return locations;
}
```

---

*End of API Documentation*