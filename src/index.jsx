import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import "leaflet/dist/leaflet.css";

const root = ReactDOM.createRoot(document.getElementById('root'));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log("✅ Tile cache service worker active"))
      .catch(err => console.error("❌ SW failed:", err));
  });
}

root.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);
