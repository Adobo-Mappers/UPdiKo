// SearchBar.jsx
import { useState } from "react";

export default function SearchBar({ onSelectLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const searchLocation = async (value) => {
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    // const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    //   value
    // )}`;
    
    const url = `http://localhost:4000/search?q=${query}`;

    const res = await fetch(url
    //     , {
    //   headers: {
    //     "User-Agent": "your-app-name", // required by OSM
    //   },
    // }
    );

    const data = await res.json();
    setResults(data);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        placeholder="Search a place..."
        value={query}
        onChange={(e) => searchLocation(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          fontSize: "16px",
        }}
      />

      {results.length > 0 && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginTop: "5px",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {results.map((place) => (
            <div
              key={place.place_id}
              onClick={() => {
                onSelectLocation({
                  lat: parseFloat(place.lat),
                  lng: parseFloat(place.lon),
                });
                setQuery(place.display_name);
                setResults([]);
              }}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
            >
              {place.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
