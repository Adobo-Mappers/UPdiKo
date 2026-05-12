import { useEffect, useState } from 'react';

const STORAGE_KEY = 'updiko_search_history_v1';
const MAX_HISTORY = 5;

const normalizeText = (value) => String(value || '').toLowerCase().trim();

/**
 * Search input with recent-history support for the unified location model.
 *
 * @param {{
 *   locations: Array<Record<string, any>>,
 *   onSelectLocation: (location: Record<string, any>) => void,
 *   placeholder?: string,
 *   initialValue?: string
 * }} props
 * @returns {JSX.Element}
 */
function SearchWithHistory({
  locations,
  onSelectLocation,
  placeholder = 'Search for services',
  initialValue = '',
}) {
  const [query, setQuery] = useState(initialValue);
  const [history, setHistory] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setQuery(initialValue || '');
  }, [initialValue]);

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    setHistory(Array.isArray(storedHistory) ? storedHistory : []);
  }, []);

  const term = normalizeText(query);
  const results = !term
    ? []
    : locations
        .filter((location) => {
          const name = normalizeText(location.name);
          const address = normalizeText(location.address);
          const tags = Array.isArray(location.tags)
            ? location.tags.map((tag) => normalizeText(tag))
            : [];

          return (
            name.includes(term) ||
            address.includes(term) ||
            tags.some((tag) => tag.includes(term))
          );
        })
        .slice(0, 8);

  const persistHistory = (location) => {
    const nextHistory = [
      location.name,
      ...history.filter((entry) => entry !== location.name),
    ].slice(0, MAX_HISTORY);

    setHistory(nextHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
  };

  const handleLocationSelection = (location) => {
    setQuery(location.name);
    setIsFocused(false);
    persistHistory(location);
    onSelectLocation(location);
  };

  const matchingHistory = history.filter((entry) =>
    normalizeText(entry).includes(normalizeText(query))
  );

  const showHistory = isFocused && !normalizeText(query) && history.length > 0;
  const showResults = isFocused && normalizeText(query) && results.length > 0;
  const showNoResults = isFocused && normalizeText(query) && results.length === 0;

  return (
    <div className="search-with-history">
      <input
        value={query}
        className="search-bar"
        placeholder={placeholder}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
      />

      {(showHistory || showResults || showNoResults) && (
        <div className="search-history-dropdown">
          {showHistory &&
            matchingHistory.map((entry) => (
              <button
                key={entry}
                className="search-history-item btn"
                onMouseDown={() => {
                  const match = locations.find((location) => location.name === entry);
                  if (match) {
                    handleLocationSelection(match);
                  }
                }}
              >
                {entry}
              </button>
            ))}

          {showResults &&
            results.map((location) => (
              <button
                key={location.id}
                className="search-history-item btn"
                onMouseDown={() => handleLocationSelection(location)}
              >
                <span>{location.name}</span>
                <small>{location.address}</small>
              </button>
            ))}

          {showNoResults && (
            <div className="search-history-empty">No matching locations found.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchWithHistory;
