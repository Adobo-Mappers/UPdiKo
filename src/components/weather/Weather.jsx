import { useEffect, useState } from 'react';

function WeatherView() {
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadForecast = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_OPENMETEO_API_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Weather fetch failed with ${response.status}`);
        }

        const payload = await response.json();
        setForecast(payload.daily || null);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Weather fetch error:', error);
        }
      }
    };

    loadForecast();

    return () => controller.abort();
  }, []);

  if (!forecast) {
    return <p>Loading weather...</p>;
  }

  return (
    <div>
      <h2>7-Day Forecast for Miagao</h2>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {forecast.time.map((date, index) => (
          <div
            key={date}
            style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}
          >
            <p>
              <strong>{date}</strong>
            </p>
            <p>High: {forecast.temperature_2m_max[index]}°C</p>
            <p>Low: {forecast.temperature_2m_min[index]}°C</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeatherView;
