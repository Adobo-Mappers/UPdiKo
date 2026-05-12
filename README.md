# About `updi-ko`

![Gif that shows Peak running up the mountain](https://github.com/user-attachments/assets/ac40b878-a459-4599-b7ac-412a9d156214)

## Creators

- Keith Ashly Domingo
- John Clyde Aparicio
- Mark Leonel Misola
- Adriel Neyro Caraig
- Christian Jave Hulleza

## Description

**`updi-ko`** is a group project made for CMSC 129: Software Engineering 2. It is a web application that helps both locals and non-locals navigate Miagao, Iloilo — covering fixed facilities on the UP Visayas campus and recommended services in the surrounding town. The project uses [Supabase](https://supabase.com/) for its database and authentication, [Leaflet](https://leafletjs.com/) via [OpenStreetMap](https://www.openstreetmap.org/) for its map, and [Google Gemini](https://ai.google.dev/) for the AI assistant.

## Features

**`updi-ko`** has the following features:

- Browse and search public services and facilities in Miagao and UPV campus.
- Filter locations by category tag (e.g. Food, Health, Campus).
- View detailed information for each location: address, opening hours, contact info, and images.
- Rate and comment on locations through the community review system.
- Get directions from your current GPS location to any pin on the map.
- Create personal pins on the map with a name, description, tags, and an optional photo.
- Address auto-fill when dropping a pin using reverse geocoding via Nominatim.
- View recent searches when using the map search bar.
- Ask **Casie**, an AI assistant powered by Google Gemini, natural language questions about nearby places.
- See today's weather in Miagao and any Philippine public holidays or campus events.
- Register an account, log in, update your profile, and manage your personal pins.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Map | Leaflet + React-Leaflet |
| State / Cache | TanStack Query + IndexedDB |
| Backend | Node.js + Express |
| AI | Google Gemini API |
| Database + Auth | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Geocoding | Nominatim (OpenStreetMap) |

## Project Structure

```
updi-ko/
├── server/
│   └── index.js                      # Express backend: Casie AI, directions, rate limiting
├── docs/
│   ├── API_DOCUMENTATION.md          # Full API and service function reference
│   └── AI_INTEGRATION.md             # Casie AI architecture and integration guide
├── src/
│   ├── App.jsx                        # Central router and QueryClientProvider wrapper
│   ├── index.jsx                      # Entry point and service worker registration
│   ├── index.css                      # Global design tokens and utility classes
│   ├── assets/                        # Images, icons, and background photos
│   ├── components/
│   │   ├── form/                      # Reusable form elements: Button, InputField, PasswordField, Dropdown
│   │   ├── typography/                # Text components: Caption, Heading, Text, Title
│   │   ├── ui/                        # UI components: Card, Carousel, Footer, Icon, MapView, Profile, Tag
│   │   ├── casie/                     # Casie AI widget, modal, and location result cards
│   │   ├── events/                    # Today's holiday and custom event display
│   │   ├── weather/                   # Live weather card for Miagao
│   │   └── calendar/                  # Calendar component (available for future use)
│   ├── hooks/
│   │   ├── useCasie.js               # Casie chat state, rate limiting, and input sanitization
│   │   └── useUnifiedLocations.js    # TanStack Query hooks for public and user locations
│   ├── pages/
│   │   ├── services/
│   │   │   ├── ServicesPage/          # Home page: search, filter, weather, events, service list
│   │   │   └── ServiceInfoPage/       # Service detail: images, info tabs, and reviews
│   │   ├── map/
│   │   │   └── MapPage/               # Map: search, pin creation, geocoding, Casie widget, routing
│   │   ├── account/
│   │   │   ├── AccountPage/           # Account dashboard
│   │   │   ├── AccountUpdatePage/     # Update display name and password
│   │   │   ├── PersonalPinsPage/      # View and delete personal pins
│   │   │   ├── LoginPage/             # Login form
│   │   │   ├── RegisterPage/          # Registration form
│   │   │   └── ForgotPasswordPage/    # Password reset form
│   │   └── lab/                       # Developer sandbox (route: /lab)
│   ├── services/
│   │   ├── supabase.js               # Auth, user profile, pins, and public location functions
│   │   ├── locations.js              # Public locations with IndexedDB cache (24-hour TTL)
│   │   ├── cassieService.js          # Casie API client: sendToCasie, clearCasieHistory
│   │   ├── reviewsService.js         # getLocationReviews and submitLocationReview
│   │   ├── storageService.js         # uploadPinImage to Supabase Storage
│   │   ├── geocoding.js              # reverseGeocode via Nominatim
│   │   ├── locationAdapter.js        # Normalizes OSM rows and user pins to a unified shape
│   │   ├── service-handler.js        # sessionStorage cache for the service list
│   │   └── api.js                    # fetchJson helper and API base URL resolver
│   └── utils/
│       └── geocoding.js              # Re-export of services/geocoding.js
├── .env.example                       # Template for required environment variables
├── vite.config.js                     # Vite config with /api proxy to Express backend
├── eslint.config.js
├── .prettierrc
└── package.json
```

## Architecture

**`updi-ko`** uses a **Module-Based + Layered Architecture**. Each page is a self-contained React component responsible for its own logic and UI. Pages access shared components and a services layer but are not directly coupled to each other — `App.jsx` is the sole routing hub.

```
[ App.jsx — Central Router + QueryClientProvider ]
|
+-- [ Pages ] --> [ Components ] --> [ Assets ]
|
+-- [ Hooks ] --> [ TanStack Query cache ]
|
+-- [ Services Layer ]
|   +-- supabase.js        talks to Supabase (auth, pins, reviews, profiles)
|   +-- locations.js       fetches public locations with IndexedDB cache fallback
|   +-- cassieService.js   sends messages to the Express backend for Casie AI
|   +-- reviewsService.js  reads and writes location reviews via Supabase
|   +-- storageService.js  uploads pin images to Supabase Storage
|   +-- geocoding.js       reverse geocodes coordinates via Nominatim
|   +-- api.js             shared fetch helper with base URL resolution
|
+-- [ Express Backend -- server/index.js ]
    +-- POST /api/cassie       proxies messages to Google Gemini, returns AI reply + places
    +-- POST /api/cassie/clear clears a chat session
    +-- POST /api/directions   requests pedestrian routing via Supabase RPC
    +-- GET  /api/health       health check
```

## API Endpoints

```
Health check:              method=GET  route=/api/health
Send message to Casie:     method=POST route=/api/cassie
Clear Casie session:       method=POST route=/api/cassie/clear
Get pedestrian directions: method=POST route=/api/directions
```

## Known Issues

- Casie AI and the directions endpoint require the Express backend to be running (`npm run dev:server`).
- Pedestrian routing via `/api/directions` requires a campus path graph loaded into Supabase. Without it, the endpoint returns a 503 and the app falls back to OSRM driving directions.
- The weather card is hidden if `VITE_OPENMETEO_API_URL` is not set in `.env`.
- The service worker (`/sw.js`) must be manually provided in the `public/` folder for map tile caching to work.
- The `location-images` Supabase Storage bucket must exist and be set to public for pin image uploads to work.

## License and Credits

This project was created as a group project for CMSC 129 - Software Engineering 2.

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- Tiles provided by [Stadia Maps](https://stadiamaps.com/).
- AI powered by [Google Gemini](https://ai.google.dev/).
- Code is free for **educational purposes** (learning, teaching, academic research).
- Code is free for **personal, non-commercial use**.

**Copyright © 2026 Keith Ashly Domingo, John Clyde Aparicio, Mark Leonel Misola, Adriel Neyro Caraig, and Christian Jave Hulleza**
