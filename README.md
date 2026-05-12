# About `updi-ko`

![Gif that shows Peak running up the mountain](https://github.com/user-attachments/assets/ac40b878-a459-4599-b7ac-412a9d156214)

## Creators

- Keith Ashly Domingo
- John Clyde Aparicio
- Mark Leonel Misola
- Adriel Neyro Caraig
- Christian Jave Hulleza

## Description

**`updi-ko`** is a project made for CMSC 129: Software Engineering 2. It is a web application that helps both locals and non-locals navigate Miagao, Iloilo — covering fixed facilities on the UP Visayas campus and recommended services in the surrounding town. The project uses [Supabase](https://supabase.com/) for its database and authentication, and [Leaflet](https://leafletjs.com/) via [OpenStreetMap](https://www.openstreetmap.org/) for its map.

## Features

**`updi-ko`** has the following features:

- Browse and search public services and facilities in Miagao and UPV campus.
- Filter locations by category tag (e.g. Food, Health, Campus).
- View detailed information for each location: address, opening hours, contact info, and images.
- Rate and comment on locations through the community review system.
- Get directions from your current GPS location to any pin on the map.
- Create personal pins on the map with a name, description, tags, and an optional photo.
- Address auto-fill when dropping a pin using reverse geocoding (Nominatim).
- View recent searches when using the map search bar.
- Ask **Casie**, an AI assistant powered by Google Gemini, natural language questions about nearby places.
- See today's weather in Miagao and any Philippine public holidays or campus events.
- Register an account, log in, update your profile, and manage your personal pins.

## Installation and Usage

Start at the `updi-ko` repository.

1. Clone the repository by opening a terminal and typing:
```
git clone <repo-url>
cd updi-ko
```

2. Install dependencies:
```
npm install
```

3. Set up your environment variables:
```
cp .env.example .env
```
Fill in your `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY` in the `.env` file.

4. Start the development servers:
   - To run the frontend, type `npm run dev` in a terminal.
   - To run the backend (required for Casie AI), open another terminal and type `npm run dev:server`.

5. Open the link to the local hosting and enjoy the website.

## API Endpoints

```
Health check:              method=GET  route=/api/health
Send message to Casie:     method=POST route=/api/cassie
Clear Casie session:       method=POST route=/api/cassie/clear
Get pedestrian directions: method=POST route=/api/directions
```

## Supabase Tables Required

```
openstreets_static_locations   public location data (OSM-sourced)
user_locations                 personal pins created by users
users                          user profile data
location_reviews               community ratings and comments
```

## Known Issues

- Directions require the Express backend (`npm run dev:server`) to be running.
- Pedestrian routing (`/api/directions`) requires a campus path graph loaded in Supabase — falls back to OSRM driving directions if unavailable.
- Weather card requires `VITE_OPENMETEO_API_URL` to be set in `.env`.
- The service worker (`/sw.js`) must be provided in the `public/` folder for tile caching to work.
- Casie AI requires a valid `GEMINI_API_KEY` in the server `.env`.

## License and Credits

This project was created as a group project for CMSC 129 - Software Engineering 2.

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- Tiles provided by [Stadia Maps](https://stadiamaps.com/).
- AI powered by [Google Gemini](https://ai.google.dev/).
- Code is free for **educational purposes** (learning, teaching, academic research).
- Code is free for **personal, non-commercial use**.

**Copyright © 2026 Keith Ashly Domingo, John Clyde Aparicio, Mark Leonel Misola, Adriel Neyro Caraig, and Christian Jave Hulleza**
