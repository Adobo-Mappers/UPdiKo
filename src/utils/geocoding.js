/**
 * Reverse-geocodes a coordinate using Nominatim.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string>}
 */
export async function reverseGeocode(latitude, longitude, options = {}) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '18',
    addressdetails: '1',
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        Accept: 'application/json',
      },
      signal: options.signal,
    }
  );

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed with ${response.status}`);
  }

  const payload = await response.json();
  return payload.display_name || 'Miagao, Iloilo';
}
