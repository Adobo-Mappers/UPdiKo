// SearchBar.jsx
import { useState } from "react";
import { supabase } from "../../services/supabase.js";

export default function SearchBar({ onSelectLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const searchLocation = async (value) => {
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    // Search static_locations using Supabase's ILIKE — powered by the pg_trgm index.
    // Searches both name and address fields, returns up to 8 results.
    const { data, error } = await supabase
      .from("static_locations")
      .select("id, name, address, latitude, longitude, tags, location_type")
      .or(`name.ilike.%${value}%,address.ilike.%${value}%`)
      .limit(8);

    if (error) {
      console.error("Error searching locations:", error);
      setResults([]);
      return;
    }

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
              key={place.id}
              onClick={() => {
                onSelectLocation({
                  lat: parseFloat(place.latitude),
                  lng: parseFloat(place.longitude),
                });
                // Show name in the search bar after selecting
                setQuery(place.name);
                setResults([]);
              }}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
            >
              {/* Name as primary label, address as secondary hint */}
              <div style={{ fontWeight: 500 }}>{place.name}</div>
              {place.address && (
                <div style={{ fontSize: "12px", color: "#888" }}>{place.address}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}