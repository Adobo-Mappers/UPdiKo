import './Weather.css';
import { useEffect, useState } from 'react';

// WMO weather code → label
function getWeatherLabel(code) {
    if (code === 0) return 'Sunny Weather';
    if (code <= 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code <= 49) return 'Foggy';
    if (code <= 57) return 'Drizzle';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 82) return 'Showers';
    if (code <= 99) return 'Thunderstorm';
    return 'Unknown';
}

function WeatherView() {
    const [today, setToday] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            try {
                const response = await fetch(import.meta.env.VITE_OPENMETEO_API_URL, {
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error(`Weather fetch failed ${response.status}`);
                const payload = await response.json();
                const daily = payload.daily;
                if (daily) {
                    setToday({
                        high: Math.round(daily.temperature_2m_max[0]),
                        low: Math.round(daily.temperature_2m_min[0]),
                        code: daily.weathercode?.[0] ?? 0,
                    });
                }
            } catch (error) {
                if (error.name !== 'AbortError') console.error('Weather fetch error:', error);
            }
        };
        load();
        return () => controller.abort();
    }, []);

    if (!today) return null;

    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <div className='weather-card mx-medium'>
            <div className='weather-icon' aria-hidden='true'></div>
            <div className='weather-copy'>
                <p className='weather-title'>{getWeatherLabel(today.code)}</p>
                <p className='weather-day'>{dayName}</p>
            </div>
        </div>
    );
}

export default WeatherView;
