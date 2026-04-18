import { useState, useEffect, useRef } from "react";
import { getStaticLocations } from "../../services/locationCache.js";
import { supabase } from "../../services/supabase.js";

export default function SearchBar({ onSelectLocation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [noResults, setNoResults] = useState(false);

  // Load all locations from cache once on mount
  useEffect(() => {
    getStaticLocations(supabase).then(setAllLocations);
  }, []);

  const searchLocation = (value) => {
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      setNoResults(false);
      return;
    }

    const lower = value.toLowerCase();
    const filtered = allLocations.filter(loc =>
      loc.name?.toLowerCase().includes(lower) ||
      loc.address?.toLowerCase().includes(lower)
    ).slice(0, 8);

    setResults(filtered);
    setNoResults(filtered.length === 0);
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

      {(results.length > 0 || noResults) && (
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
          {noResults && (
            <div style={{ padding: "10px", color: "#888", fontSize: "14px", textAlign: "center" }}>
              No results found for "{query}"
            </div>
          )}

          {results.map((place) => (
            <div
              key={place.id}
              onClick={() => {
                onSelectLocation({
                  lat: parseFloat(place.latitude),
                  lng: parseFloat(place.longitude),
                });
                setQuery(place.name);
                setResults([]);
                setNoResults(false);
              }}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
            >
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