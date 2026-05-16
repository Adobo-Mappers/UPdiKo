import './Weather.css';
import { useEffect, useState } from 'react';
import { Text, Caption } from '../typography';

// WMO weather code → label
function getWeatherLabel(code) {
    if (code === 0) return 'Clear Sky';
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

    return (
        <div className='weather-card'>
            <div className='weather-temp'>
                <span className='weather-circle'>☀️</span>
                <Text><em className='fw-bold'>{today.high}° C</em></Text>
            </div>
            <Caption className='text-muted'>Today is {getWeatherLabel(today.code)}</Caption>
        </div>
    );
}

export default WeatherView;
