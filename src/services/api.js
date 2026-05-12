const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Normalizes API URLs so the frontend can use Vite proxying in development
 * and an explicit backend origin in other environments.
 *
 * @param {string} path
 * @returns {string}
 */
export function getApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!DEFAULT_API_BASE) {
    return normalizedPath;
  }

  return `${DEFAULT_API_BASE}${normalizedPath}`;
}

/**
 * Small fetch helper that always returns parsed JSON for API responses.
 *
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function fetchJson(path, options = {}) {
  const response = await fetch(getApiUrl(path), options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Request failed with ${response.status}`);
  }

  return payload;
}
