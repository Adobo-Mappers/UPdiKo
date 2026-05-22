# Casie AI Integration Guide

> **Last Updated:** May 2026  
> **Version:** 3.0.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Components](#3-components)
4. [API Endpoints](#4-api-endpoints)
5. [Frontend Integration](#5-frontend-integration)
6. [Gemini Function Calling](#6-gemini-function-calling)
7. [Session Management](#7-session-management)
8. [Security](#8-security)
9. [Configuration](#9-configuration)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Overview

### 1.1 What is Casie?

Casie is an AI-powered chatbot that helps users discover locations in Miagao, Iloilo. It combines:

- **Conversational interface** — Natural language queries
- **Location search** — Integration with the Supabase `openstreets_static_locations` table
- **Map integration** — Clickable location cards that center the map

### 1.2 Key Features

| Feature | Description |
|--------|-------------|
| Natural language search | "Find restaurants near campus" |
| Quick prompts | Pre-defined common queries shown on first open |
| Location cards | Clickable results that navigate the map |
| Session continuity | Remembers conversation context via client-driven history (last 20 turns) |
| Rate limiting | 40 requests per 15 min per IP; 2 sec client-side cooldown |
| Input sanitization | Prompt injection patterns filtered before sending to Gemini |

---

## 2. Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────┐
│                   UPdiKo Frontend                   │
│                                                     │
│  ┌──────────────────┐   ┌────────────────────────┐  │
│  │  CassieWidget    │   │  (Future: CassieSection)│  │
│  │  (Floating FAB)  │   │  (Full-page chat)       │  │
│  └────────┬─────────┘   └────────────────────────┘  │
│           │                                         │
│           ▼                                         │
│  ┌────────────────────────────────────┐             │
│  │  useCasie.js (hook)                │             │
│  │  - rate limiting (2s cooldown)     │             │
│  │  - daily message limit (50/day)    │             │
│  │  - input sanitization              │             │
│  └────────────┬───────────────────────┘             │
│               │                                     │
│  ┌────────────▼───────────────────────┐             │
│  │  cassieService.js                  │             │
│  │  - sendToCasie()                   │             │
│  │  - clearCasieHistory()             │             │
│  └────────────┬───────────────────────┘             │
└───────────────┼─────────────────────────────────────┘
                │  POST /api/cassie
                ▼
┌─────────────────────────────────────────────────────┐
│              Express Backend (server/index.js)       │
│                                                     │
│  1. Validate message                                │
│  2. Parse client-provided history array             │
│  3. First Gemini call (with search_locations tool)  │
│  4. If tool triggered → query Supabase DB           │
│  5. Second Gemini call (synthesize with results)    │
│  6. Return { message, places, sessionId }           │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Supabase — openstreets_static_locations     │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
User types: "Find restaurants"
        │
        ▼
useCasie.js → sanitize → rate check → daily limit check
        │
        ▼
cassieService.sendToCasie({ message, context, sessionId })
        │  POST /api/cassie
        ▼
server/index.js
  └─► Gemini call 1 (tool definition included)
      └─► Gemini returns function call: search_locations({ category: "restaurant" })
          └─► queryLocations() → Supabase → results
              └─► Gemini call 2 (synthesize with results)
                  └─► Returns natural language response
        │
        ▼
{ message: "I found 3 restaurants...", places: [...], sessionId: "uuid" }
        │
        ▼
CassieWidget → renders message + LocationCards
```

---

## 3. Components

### 3.1 Backend (`server/index.js`)

| Function | Purpose |
|----------|---------|
| `ensureSessionId()` | Generate UUID if no session provided |
| `getDynamicContext()` | Append current page / user coords to system prompt |
| `queryLocations()` | Filter Supabase locations by category/keyword |
| `loadPublicLocations()` | Fetch all locations from Supabase |
| `callGemini()` | Authenticated Gemini REST call |
| `POST /api/cassie` | Main chat endpoint with rate limiting |
| `POST /api/cassie/clear` | Clear a session |
| `POST /api/directions` | Pedestrian routing via Supabase RPC |

### 3.2 Frontend Hook (`src/hooks/useCasie.js`)

| Export | Purpose |
|--------|---------|
| `useCasie(context)` | Full chat state: messages, input, loading, send, clear |
| `sendMessage(override?)` | Send with rate limiting + daily cap |
| `clearSession()` | Reset session on backend + local state |

### 3.3 Frontend Service (`src/services/cassieService.js`)

| Function | Purpose |
|----------|---------|
| `sendToCasie(payload)` | POST to `/api/cassie` |
| `clearCasieHistory(sessionId)` | POST to `/api/cassie/clear` |

### 3.4 Frontend Components

| Component | Path | Description |
|-----------|------|-------------|
| `CassieWidget` | `src/components/casie/CassieWidget.jsx` | Floating FAB + inline chat panel |
| `LocationCards` | `src/components/casie/LocationCards.jsx` | Clickable location result cards |
| `CasieModal` | `src/components/casie/CasieModal.jsx` | "Go to this location?" confirmation dialog |

---

## 4. API Endpoints

### 4.1 POST /api/cassie

Send a message to Casie.

**Request:**
```json
{
  "message": "Find restaurants",
  "sessionId": "optional-uuid-from-previous-response",
  "context": {
    "currentPage": "MAP",
    "userLocation": { "lat": 10.6419, "lng": 122.2354 },
    "selectedLocation": { "name": "UPV Main Library" }
  }
}
```

**Response:**
```json
{
  "message": "I found some restaurants for you! Here are a few options nearby...",
  "places": [
    {
      "id": 42,
      "name": "Kusina ni Co",
      "address": "Miagao, Iloilo",
      "latitude": 10.64,
      "longitude": 122.07,
      "tags": ["restaurant", "food"]
    }
  ],
  "sessionId": "uuid-for-next-message",
  "history": []
}
```

### 4.2 POST /api/cassie/clear

Clear a conversation session.

**Request:** `{ "sessionId": "uuid" }`  
**Response:** `{ "success": true }`

### 4.3 POST /api/directions

Get pedestrian routing between two coordinates.

**Request:**
```json
{ "startLat": 10.64, "startLng": 122.23, "endLat": 10.65, "endLng": 122.24 }
```

**Response:**
```json
{
  "coordinates": [[10.64, 122.23], ...],
  "distanceMeters": 450,
  "durationMinutes": 6
}
```

---

## 5. Frontend Integration

### 5.1 Using the Hook (recommended)

```jsx
import { useCasie } from '../hooks/useCasie';

function MyChatComponent({ userLocation }) {
  const context = { currentPage: 'MAP', userLocation };
  const { messages, input, isLoading, setInput, sendMessage, clearSession } = useCasie(context);

  return (
    <div>
      {messages.map((m, i) => <p key={i}>{m.content}</p>)}
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={() => sendMessage()}>Send</button>
    </div>
  );
}
```

### 5.2 Using CassieWidget

```jsx
import CassieWidget from '../components/casie/CassieWidget';

function MapPage() {
  return (
    <div>
      {/* ... map ... */}
      <CassieWidget
        currentSection="MAP"
        userLocation={{ lat: 10.64, lng: 122.23 }}
        selectedService={selectedService}
        onNavigateToLocation={(place) => {
          map.flyTo([place.latitude, place.longitude]);
        }}
      />
    </div>
  );
}
```

### 5.3 CassieWidget Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentSection` | string | No | Current page name sent as context |
| `selectedService` | object | No | Currently selected location |
| `userLocation` | `{ lat, lng }` | No | User GPS coordinates |
| `onNavigateToLocation` | function | No | Called when user taps a location card |

---

## 6. Gemini Function Calling

### 6.1 How It Works

```
1. User sends message
2. Backend sends message + search_locations tool definition to Gemini
3. Gemini decides if a location search is needed
4. If yes → Gemini returns a function call with { category, keyword }
5. Backend queries Supabase with those params
6. Results pushed back to Gemini as a function response
7. Gemini generates a natural language reply mentioning only real location names
8. Backend returns reply + places array to frontend
```

### 6.2 Tool Definition

```javascript
const searchLocationsTool = {
  functionDeclarations: [{
    name: 'search_locations',
    description: 'Searches public UPdiKo locations for category or keyword matches.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'e.g. restaurant, pharmacy, clinic' },
        keyword:  { type: 'string', description: 'Specific name or term' }
      }
    }
  }]
};
```

### 6.3 Two-Step Gemini Process

| Step | Purpose | Tools |
|------|---------|-------|
| Call 1 | Detect if search needed, get function call | `search_locations` enabled |
| Call 2 | Synthesize natural response with DB results | No tools (text only) |

---

## 7. Session Management

### 7.1 Client-Driven History

Conversation context is managed client-side to survive serverless cold starts on Vercel:

1. **Client** — The `useCasie` hook stores conversation history in a `useRef([])`. Each call to `sendToCasie()` includes the current `history` array.
2. **Server** — Receives `history` from the request body, appends the new user message and assistant reply, trims to the last 20 turns, and returns the updated `history` in the response.
3. **Client** — On response, updates `historyRef` with the returned `history` array.
4. **Clear** — `clearSession()` resets `historyRef` to `[]` locally; the `/api/cassie/clear` endpoint is also called for housekeeping.

### 7.2 Client-side limits (useCasie.js)

| Limit | Value |
|-------|-------|
| Min time between messages | 2 seconds |
| Daily message cap | 50 messages |
| Max input length | 500 characters |
| History cap | 20 turns (server-side trim) |

### 7.3 Serverless Considerations

- History is **not persisted** on the server — zero server-side state.
- If the client does not send `history`, each message is treated as a new conversation.
- The `history` array uses the Gemini API content format (`{ role, parts }`).
- The `sessionId` is still generated and returned but is informational; history, not sessionId, drives continuity.

---

## 8. Security

### 8.1 API Key

- The Gemini API key is **only on the server** (`GEMINI_API_KEY` env var)
- Frontend calls `/api/cassie` — never Gemini directly
- No API key is ever sent to the browser

### 8.2 Rate Limiting

Express rate limiter: **40 requests per 15 minutes per IP** (returns 429 on exceed). Uses in-memory storage — limits reset on Vercel serverless cold starts. For persistent rate limiting, configure an external store (Vercel KV, Upstash).

### 8.3 Input Sanitization

Prompt injection patterns filtered in `useCasie.js` before sending:

```
/ignore\s+(previous|all|prior)/i
/forget\s+(everything|all|previous)/i
/disregard\s+(instructions|system)/i
/system\s*:/i
/you\s+are\s+(now|a)/i
/act\s+as\s+if/i
/pretend\s+(to|you)/i
```

---

## 9. Configuration

### 9.1 Environment Variables

| Variable | Where | Required | Description |
|----------|-------|----------|-------------|
| `GEMINI_API_KEY` | server `.env` | ✅ | Gemini API key (never expose client-side) |
| `GEMINI_MODELS` | server `.env` | No | Comma-separated model fallback list; defaults to `gemini-2.0-flash,gemini-1.5-flash,gemini-1.5-flash-8b` |
| `VITE_SUPABASE_URL` | `.env` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` | ✅ | Supabase anon key |
| `VITE_API_BASE` | `.env` | No | Backend base URL (empty = use Vite proxy) |
| `PORT` | server `.env` | No | Express port (default: 3000) |

### 9.2 Example .env

```env
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
GEMINI_API_KEY=AIza...
GEMINI_MODELS=gemini-2.0-flash,gemini-1.5-flash
PORT=3000
```

---

## 10. Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `"Missing GEMINI_API_KEY"` | Env var not set on server | Add to Vercel Environment Variables or server `.env` |
| Empty `places` array | No DB matches | Verify `openstreets_static_locations` has data |
| 429 Too Many Requests | Rate limit hit | Wait 15 min or increase `max` in `casieLimiter` |
| Conversation context lost between messages | Client not passing `history` back | Ensure `useCasie` hook is used (manages historyRef internally) |
| CORS error | Frontend origin not whitelisted | Set `CORS_ORIGIN` env var to production URL |
| `"AI is not configured correctly"` | Client can't reach `/api/cassie` | In dev, ensure `npm run dev:server` is running; in prod, check Vercel function logs |
| Gemini timeout on Vercel | Cold start + two sequential Gemini calls exceed 10s (Hobby) | Upgrade to Vercel Pro (15s timeout) or reduce `GEMINI_MODELS` list |

---

## Appendix: File Structure

```
src/
├── components/casie/
│   ├── CassieWidget.jsx      # Floating FAB + inline chat
│   ├── CassieWidget.css
│   ├── LocationCards.jsx     # Clickable location results
│   ├── LocationCards.css
│   ├── CasieModal.jsx        # Navigate confirmation dialog
│   └── CasieModal.css
├── hooks/
│   └── useCasie.js           # Chat state hook
├── services/
│   └── cassieService.js      # API client (sendToCasie, clearCasieHistory)
server/
└── index.js                  # Express server (all backend logic)
docs/
└── AI_INTEGRATION.md         # This file
```

---

*End of AI Integration Guide*
