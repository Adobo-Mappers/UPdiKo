# UPdiKo API Documentation

> **Last Updated:** May 2026  
> **Version:** 2.0.0  
> **Base URL:** `http://localhost:3000`

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Architecture](#2-architecture)
3. [API Endpoints](#3-api-endpoints)
4. [Supabase Services](#4-supabase-services)
5. [Database Schema](#5-database-schema)
6. [Authentication](#6-authentication)
7. [Error Handling](#7-error-handling)
8. [Rate Limits](#8-rate-limits)
9. [Code Examples](#9-code-examples)

---

## 1. Getting Started

### 1.1 Prerequisites

- Node.js v18 or higher
- npm
- A Supabase project with the required tables
- A Google Gemini API key

### 1.2 Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, GEMINI_API_KEY

# Start frontend (Vite dev server)
npm run dev

# Start backend (Express — required for Casie AI and directions)
npm run dev:server
```

You should see:
```
UPdiKo backend listening on http://localhost:3000
```

### 1.3 Health Check

```bash
curl http://localhost:3000/api/health
# → { "status": "ok" }
```

---

## 2. Architecture

### 2.1 Backend Overview

The Express backend (`server/index.js`) handles three concerns:

```
server/index.js
├── POST /api/cassie          # Casie AI chat (Gemini + Supabase location search)
├── POST /api/cassie/clear    # Clear a chat session
├── POST /api/directions      # Pedestrian routing via Supabase RPC
└── GET  /api/health          # Health check
```

Locations are stored and served from **Supabase** (PostgreSQL), not SQLite. The frontend fetches them directly via the Supabase client and caches them in **IndexedDB** (24-hour TTL).

### 2.2 Data Flow

```
Frontend (React + Vite)
│
├── Public locations  → supabase.js → openstreets_static_locations table
├── User pins         → supabase.js → user_locations table
├── Reviews           → reviewsService.js → location_reviews table
├── Images            → storageService.js → Supabase Storage
│
├── Casie AI          → cassieService.js → POST /api/cassie → Gemini API
├── Directions        → locations.js (getRoute) → OSRM public API (no backend needed)
└── Geocoding         → geocoding.js → Nominatim (OpenStreetMap)
```

---

## 3. API Endpoints

### 3.1 GET /api/health

Health check.

**Response:**
```json
{ "status": "ok" }
```

---

### 3.2 POST /api/cassie

Send a message to the Casie AI assistant.

**Request:**
```json
{
  "message": "Find restaurants near campus",
  "sessionId": "optional-uuid",
  "context": {
    "currentPage": "MAP",
    "userLocation": { "lat": 10.6419, "lng": 122.2354 },
    "selectedLocation": { "name": "UPV Main Library" }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ | User's message (max 500 chars after sanitization) |
| `sessionId` | string | No | UUID from previous response for continuity |
| `context.currentPage` | string | No | Current page (HOME, MAP, etc.) |
| `context.userLocation` | object | No | User GPS `{ lat, lng }` |
| `context.selectedLocation` | object | No | Currently selected location `{ name }` |

**Response (200):**
```json
{
  "message": "Here are some restaurants I found...",
  "places": [
    {
      "id": 42,
      "name": "Kusina ni Co",
      "address": "Miagao, Iloilo",
      "latitude": 10.6425,
      "longitude": 122.0762,
      "tags": ["restaurant", "food"]
    }
  ],
  "sessionId": "uuid-for-next-message"
}
```

**Errors:**
| Status | Cause |
|--------|-------|
| `400` | Empty message |
| `429` | Rate limit exceeded (40 req / 15 min) |
| `500` | Gemini API error or Supabase failure |

---

### 3.3 POST /api/cassie/clear

Clear a session's conversation history.

**Request:** `{ "sessionId": "uuid" }`  
**Response:** `{ "success": true }`

---

### 3.4 POST /api/directions

Get pedestrian routing between two coordinates using a Supabase RPC function.

**Request:**
```json
{
  "startLat": 10.641944,
  "startLng": 122.235556,
  "endLat": 10.645000,
  "endLng": 122.238000
}
```

**Response (200):**
```json
{
  "coordinates": [[10.6419, 122.2355], [10.6425, 122.2362], ...],
  "distanceMeters": 450,
  "durationMinutes": 6
}
```

**Error (503):** Returned when the campus path graph hasn't been loaded into Supabase yet.

```json
{
  "error": "Pedestrian routing is not ready yet. Load the campus path graph in Supabase, then retry.",
  "detail": "..."
}
```

---

## 4. Supabase Services

These are frontend service functions that talk directly to Supabase (not via the Express server).

### 4.1 `src/services/supabase.js`

| Function | Description |
|----------|-------------|
| `signUp(email, password, name)` | Register new user |
| `logIn(email, password)` | Sign in |
| `logOut()` | Sign out |
| `getCurrentUser()` | Get current session user |
| `onAuthStateChangedListener(cb)` | Subscribe to auth changes |
| `updateUserProfile(updates)` | Update display name / photo |
| `updateUserPassword(newPass, currentPass)` | Change password (re-auth required) |
| `sendPasswordReset(email)` | Send reset email |
| `saveUserDataToDB(uid, data)` | Upsert user row in `users` table |
| `getUserDataFromDB(uid)` | Read user row |
| `addPinnedLocationToDB(uid, location)` | Create a personal pin |
| `getPinnedLocationsFromDB(uid)` | Get all pins for a user |
| `deletePinnedLocationFromDB(uid, id)` | Delete a pin |
| `getPublicLocationsFromDB()` | Read all public locations |

### 4.2 `src/services/locations.js`

| Function | Description |
|----------|-------------|
| `getStaticLocations(supabase)` | Fetch public locations with IndexedDB cache (24h TTL) |
| `getRoute(startLat, startLng, endLat, endLng)` | Fetch driving route coordinates from OSRM; returns `[lat, lng][]` for the polyline |
| `getCacheStatus()` | Debug info about the IndexedDB cache |
| `matchLocation(locations, searchTerm)` | Find a location by name/tag |
| `queryLocations(locations, options)` | Filter + sort by category, keyword, distance |
| `getNearbyLocations(lat, lng, radius, options)` | Get locations within radius km |

### 4.3 `src/services/reviewsService.js`

| Function | Description |
|----------|-------------|
| `getLocationReviews(locationId)` | Fetch all reviews for a location |
| `submitLocationReview(review)` | Create or update a review (upsert on `location_id + user_id`) |

**Review shape:**
```javascript
{
  locationId: number,
  userId: string,
  userName: string,
  rating: number,    // 1-5
  comment: string,
}
```

### 4.4 `src/services/storageService.js`

| Function | Description |
|----------|-------------|
| `uploadPinImage(file, userId)` | Upload pin image to `location-images` bucket, returns public URL |

### 4.5 `src/services/geocoding.js`

| Function | Description |
|----------|-------------|
| `reverseGeocode(lat, lng, options?)` | Reverse geocode via Nominatim; returns address string; supports AbortSignal |

### 4.6 `src/services/locationAdapter.js`

| Function | Description |
|----------|-------------|
| `normalizeOpenStreetLocation(loc)` | Maps a Supabase OSM row to `UnifiedLocation` shape |
| `normalizeUserLocation(loc)` | Maps a user pin row to `UnifiedLocation` shape |
| `createUnifiedLocations(public, user)` | Merges both arrays into one unified list |

**UnifiedLocation shape:**

```typescript
{
  id: string;              // "osm-42" or "user-7"
  recordId: number | null;
  name: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  tags: string[];
  source: 'OSM' | 'USER';
  locationType: string;
  openingHours: string[];
  contactInfo: string[];
  images: string[];
  imageUrl: string | null;
  description: string | null;
  rawData: object;
}
```

---

## 5. Database Schema

### 5.1 `openstreets_static_locations`

Public location data sourced from OpenStreetMap.

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer | Primary key |
| `name` | text | Location name |
| `latitude` | float | Latitude |
| `longitude` | float | Longitude |
| `address` | text | Full address |
| `tags` | text[] | Category tags (e.g. `["restaurant", "food"]`) |
| `opening_hours` | text[] | Hours strings |
| `contact_info` | text[] | Email/phone strings |
| `location_type` | text | `"campus"` or `"community"` |
| `services` | text[] | Services offered |
| `images` | text[] | Image URLs |
| `additional_info` | jsonb | Extra metadata |

### 5.2 `user_locations`

Personal pins created by authenticated users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → auth.users |
| `location_name` | text | Pin name |
| `address` | text | Address |
| `latitude` | float | Latitude |
| `longitude` | float | Longitude |
| `description` | text | Optional description |
| `tags` | text[] | User-defined tags |
| `image_url` | text | URL of uploaded image |

### 5.3 `users`

Public user profile data (synced from Supabase Auth).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | FK → auth.users |
| `name` | text | Display name |
| `email` | text | Email address |

### 5.4 `location_reviews`

Community reviews for public locations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `location_id` | integer | FK → openstreets_static_locations.id |
| `user_id` | uuid | FK → auth.users |
| `reviewer_name` | text | Display name at time of review |
| `rating` | integer | 1–5 stars |
| `comment` | text | Review text |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update time |

**Unique constraint:** `(location_id, user_id)` — one review per user per location (upsert).

---

## 6. Authentication

User authentication is handled entirely by **Supabase Auth**.

```javascript
import { supabase } from './services/supabase';

// Sign up
await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });

// Sign in
await supabase.auth.signInWithPassword({ email, password });

// Sign out
await supabase.auth.signOut();

// Get current user
const { data } = await supabase.auth.getSession();
const user = data.session?.user ?? null;
```

The Express backend does **not** validate user tokens — it is used only for Casie AI and routing. Personal data endpoints (pins, reviews) rely on Supabase Row Level Security (RLS).

---

## 7. Error Handling

### HTTP Status Codes

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `400` | Bad request (missing required field) |
| `429` | Rate limit exceeded |
| `500` | Server error |
| `503` | Service unavailable (e.g. routing not configured) |

### Error Response Format

```json
{ "error": "Human-readable error message" }
```

### Frontend Error Mapping (useCasie.js)

| Error string | User-facing message |
|--------------|-------------------|
| `429` / `quota` / `rate` | "You've sent too many messages. Please wait a moment." |
| `network` / `fetch` | "Unable to connect. Check your internet connection." |
| `api key` / `permission` | "AI is not configured correctly." |

---

## 8. Rate Limits

### Express Backend

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/cassie` | 40 requests | 15 minutes |
| All others | Unlimited | — |

### Client-side (useCasie.js)

| Limit | Value |
|-------|-------|
| Min time between messages | 2 seconds |
| Daily message cap | 50 messages |
| Max input length | 500 characters |

### Nominatim (Geocoding)

Per Nominatim usage policy: max 1 request/second, no bulk requests. The app uses AbortController to cancel pending geocoding requests when the pin form is closed.

---

## 9. Code Examples

### 9.1 Fetch public locations (with cache)

```javascript
import { getStaticLocations } from './services/locations';
import { supabase } from './services/supabase';

const locations = await getStaticLocations(supabase);
// Returns from IndexedDB if fresh (<24h), otherwise fetches from Supabase
```

### 9.2 Submit a review

```javascript
import { submitLocationReview } from './services/reviewsService';

await submitLocationReview({
  locationId: 42,
  userId: user.id,
  userName: user.user_metadata?.display_name ?? user.email,
  rating: 5,
  comment: 'Great place!',
});
```

### 9.3 Create a personal pin with image

```javascript
import { uploadPinImage } from './services/storageService';
import { addPinnedLocationToDB } from './services/supabase';

const imageUrl = await uploadPinImage(file, user.id);
await addPinnedLocationToDB(user.id, {
  locationName: 'My Spot',
  address: 'Miagao, Iloilo',
  latitude: 10.6419,
  longitude: 122.2354,
  description: 'My favorite study corner',
  tags: ['study', 'quiet'],
  imageUrl,
});
```

### 9.4 Reverse geocode a coordinate

```javascript
import { reverseGeocode } from './services/geocoding';

const controller = new AbortController();
const address = await reverseGeocode(10.6419, 122.2354, { signal: controller.signal });
// → "University of the Philippines Visayas, Miagao, Iloilo, Philippines"

// Cancel if needed:
controller.abort();
```

### 9.5 Chat with Casie (direct service call)

```javascript
import { sendToCasie, clearCasieHistory } from './services/cassieService';

let sessionId = null;

const response = await sendToCasie({
  message: 'Find pharmacies',
  sessionId,
  context: { currentPage: 'MAP', userLocation: { lat: 10.64, lng: 122.23 } },
});

sessionId = response.sessionId;
console.log(response.message);   // Natural language reply
console.log(response.places);    // Array of matching locations
```

### 9.6 cURL — Test Casie

```bash
curl -X POST http://localhost:3000/api/cassie \
  -H "Content-Type: application/json" \
  -d '{"message": "Where is the library?"}'
```

### 9.7 cURL — Get directions

```bash
curl -X POST http://localhost:3000/api/directions \
  -H "Content-Type: application/json" \
  -d '{"startLat":10.641944,"startLng":122.235556,"endLat":10.645,"endLng":122.238}'
```

---

*End of API Documentation*
