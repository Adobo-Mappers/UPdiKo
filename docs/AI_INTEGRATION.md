# Casie AI Integration Guide

> **Last Updated:** April 2026  
> **Version:** 1.0.0

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

- **Conversational interface** - Natural language queries
- **Location search** - Integration with local SQLite database
- **Map integration** - Click to navigate to locations

### 1.2 Key Features

| Feature | Description |
|--------|-------------|
| Natural language search | "Find restaurants near campus" |
| Quick prompts | Pre-defined common queries |
| Location cards | Clickable results on map |
| Session continuity | Remembers conversation context |
| Distance calculation | Shows nearby locations |

---

## 2. Architecture

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      UPdiKo App                           │
├───────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌──────────────────────────────┐  │
│  │ CassieWidget    │    │ CassieSection                 │  │
│  │ (Floating)      │    │ (Full Page)                   │  │
│  └────────┬────────┘    └──────────────┬───────────────┘  │
│           │                               │                  │
│           └───────────┬─────────────────┘                  │
│                       ▼                                    │
│         ┌──────────────────────────────┐                │
│         │  cassieService.js (Frontend)   │                │
│         │  - sendToCasie()              │                │
│         │  - clearCasieHistory()         │                │
│         └──────────────┬───────────────┘                │
│                        │                                 │
└────────────────────────┼─────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                    Express Server                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│    ┌─────────────────────────────────────────────────────┐  │
│    │  gemini.js (Backend)                                 │  │
│    │                                                     │  │
│    │  1. Receive message + context                        │  │
│    │  2. Call Gemini with tool definition                │  │
│    │  3. If tool called → query locations DB            │  │
│    │  4. Second Gemini call to synthesize response      │  │
│    │  5. Return message + places to frontend          │  │
│    └─────────────────────────────────────────────────────┘  │
│                             │                               │
│                             ▼                               │
│         ┌────────────────────────────────────────┐         │
│         │  SQLite Database                       │         │
│         │  - locations table                    │         │
│         └────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
User: "Find restaurants"
        │
        ▼
┌───────────────────┐
│ CassieWidget.jsx  │
│ sendToCasie()     │
└────────┬──────────┘
         │ POST /api/cassie
         ▼
┌───────────────────┐
│ server/gemini.js  │
│                  │
│ 1. Get session   │
│ 2. Gemini call   │
│    └─► function  │
│ 3. Query DB     │
│ 4. Synthesize  │
└────────┬──────────┘
         │ { message, places }
         ▼
┌───────────────────┐
│ CassieWidget    │
│ Display message │
│ + LocationCards │
└───────────────────┘
```

---

## 3. Components

### 3.1 Backend (server/gemini.js)

| Function | Purpose |
|----------|---------|
| `getGenAIInstance()` | Lazy-load Gemini client |
| `queryLocations()` | Search SQLite database |
| `router.post('/')` | Main chat endpoint |
| Session cleanup | Auto-remove abandoned sessions |

### 3.2 Frontend Service (src/services/cassieService.js)

| Function | Purpose |
|----------|---------|
| `sendToCasie()` | Send message, get response |
| `clearCasieHistory()` | Clear session on backend |
| `resetSession()` | Reset local session ID |

### 3.3 Frontend Components

| Component | File | Description |
|-----------|------|-------------|
| CassieWidget | `src/components/cassie/CassieWidget.jsx` | Floating chat button |
| CassieSection | `src/pages/cassie/CassieSection.jsx` | Full-page chat |
| LocationCards | `src/components/casie/LocationCards.jsx` | Display search results |

---

## 4. API Endpoints

### 4.1 POST /api/cassie

Send a message to Casie.

```bash
curl -X POST http://localhost:3000/api/cassie \
  -H "Content-Type: application/json" \
  -H "X-Gemini-Key: YOUR_API_KEY" \
  -d '{
    "message": "Find restaurants",
    "context": {
      "currentPage": "MAP",
      "userLocation": { "lat": 10.64, "lng": 122.07 }
    }
  }'
```

**Response:**
```json
{
  "message": "I found some restaurants for you! ...",
  "places": [
    { "name": "Kusina ni Co", "lat": 10.64, "lng": 122.07 }
  ],
  "sessionId": "uuid-for-next-message"
}
```

### 4.2 POST /api/cassie/clear

Clear conversation history.

```bash
curl -X POST http://localhost:3000/api/cassie/clear \
  -H "Content-Type: application/json" \
  -H "X-Gemini-Key: YOUR_API_KEY" \
  -d '{"sessionId": "current-session-id"}'
```

---

## 5. Frontend Integration

### 5.1 Basic Usage

```jsx
import { sendToCasie, clearCasieHistory } from '../services/cassieService';

function MyComponent() {
  const handleSend = async () => {
    const { message, places } = await sendToCasie(
      "Find the library",
      { currentPage: "MAP", userLocation: { lat: 10.64, lng: 122.07 } }
    );
    console.log(message, places);
  };
  
  return <button onClick={handleSend}>Ask Casie</button>;
}
```

### 5.2 Using CassieWidget

```jsx
import CassieWidget from '../components/cassie/CassieWidget';

function MapPage() {
  const handleNavigate = (place) => {
    // Center map on selected location
    map.flyTo([place.latitude, place.longitude]);
  };
  
  return (
    <MapView>
      <CassieWidget
        currentSection="MAP"
        userLocation={userCoords}
        onNavigateToLocation={handleNavigate}
      />
    </MapView>
  );
}
```

### 5.3 Props

| Prop | Type | Required | Description |
|-----|------|----------|-------------|
| `currentSection` | string | No | Current app section |
| `selectedService` | object | No | Selected location |
| `userLocation` | object | No | User's GPS coords |
| `onNavigateToLocation` | function | No | Location select callback |

---

## 6. Gemini Function Calling

### 6.1 How It Works

Casie uses Gemini's function calling feature to search the database:

```
1. User asks: "Find restaurants"
2. Gemini receives message + search_locations tool definition
3. Gemini decides to call tool → sends function call
4. Backend executes queryLocations()
5. Results pushed back to Gemini
6. Gemini generates natural response
7. Return to frontend
```

### 6.2 Tool Definition

```javascript
const searchLocationsTool = {
  name: "search_locations",
  description: "Searches places in Miagao...",
  parameters: {
    type: "object",
    properties: {
      category: { type: "string", description: "e.g., restaurant, pharmacy" },
      keyword: { type: "string", description: "Specific name to search" }
    }
  }
};
```

### 6.3 Two-Step Process

The backend makes TWO Gemini API calls:

1. **Initial call** - With tool definition, gets function call
2. **Synthesis call** - With DB results, gets natural response

This ensures:
- Accurate data from database
- Natural-sounding AI response

---

## 7. Session Management

### 7.1 Session Flow

```
Client sends message
    │
    ▼
No sessionId? → Generate UUID
    │
    ▼
Add to sessions Map
    │
    ▼
Process message
    │
    ▼
Return with sessionId
    │
    ▼
Client uses sessionId for next message
```

### 7.2 Session Cleanup

Sessions auto-expire after 15 minutes of inactivity:

```javascript
// Automatic cleanup every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, lastActive] of sessionTimestamps) {
    if (now - lastActive > 15 * 60 * 1000) {
      sessions.delete(sessionId);
    }
  }
}, SESSION_CLEANUP_INTERVAL_MS);
```

This prevents memory leaks from abandoned sessions.

---

## 8. Security

### 8.1 Input Sanitization

User input is sanitized before sending to Gemini:

```javascript
const sanitizeInput = (text) => {
  let sanitized = text.trim();
  
  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }
  
  // Filter injection patterns
  const patterns = [
    /ignore\s+previous/i,
    /forget\s+everything/i,
    /system\s*:/i
  ];
  
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, '[ FILTERED ]');
  }
  
  return sanitized;
};
```

### 8.2 API Key

Gemini API key passed in header:

```javascript
headers: {
  'X-Gemini-Key': process.env.VITE_GEMINI_API_KEY
}
```

**Never expose in frontend code!**

---

## 9. Configuration

### 9.1 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | Yes | Client-side Gemini key |
| `API_BASE` | No | Backend URL (default: localhost:3000) |
| `GEMINI_MODEL` | No | Model name (default: gemini-2.0-flash) |

### 9.2 .env File

```env
VITE_GEMINI_API_KEY=your-api-key-here
API_BASE=http://localhost:3000
```

### 9.3 Server Configuration

In `server/gemini.js`:

```javascript
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
```

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Gemini API key not provided" | Missing header | Add `X-Gemini-Key` header |
| Empty places array | No matches in DB | Check database has data |
| Session lost | 15 min timeout | Continue conversation |
| Model error | API quota exceeded | Check API dashboard |

### 10.2 Debug Logging

Enable debug logging in browser console:

```javascript
// Check cassieService.js for console.log
// Not production-ready - remove before deploy
```

### 10.3 Testing

```bash
# Start backend
node server/index.js

# Test API
curl -X POST http://localhost:3000/api/cassie \
  -H "Content-Type: application/json" \
  -H "X-Gemini-Key: $GEMINI_KEY" \
  -d '{"message": "Hello"}'
```

---

## Appendix: File Structure

```
src/
├── components/
│   └── cassie/
│       ├── CassieWidget.jsx      # Floating chat
│       └── LocationCards.jsx   # Results display
├── pages/
│   └── cassie/
│       └── CassieSection.jsx   # Full-page chat
├── services/
│   └── cassieService.js      # API client
server/
├── gemini.js               # AI backend
└── index.js              # Express server

docs/
└── AI_INTEGRATION.md      # This file
```

---

*End of AI Integration Guide*