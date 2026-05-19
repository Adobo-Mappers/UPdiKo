import './Weather.css';
import { Text, Heading, Title } from '../typography';
import { Icon } from '../ui/Icon/Icon';
import { useEffect, useState } from 'react';

// WMO weather code → label
function getWeatherLabel(code) {
    if (code === 0) return "It's Sunny Today";
    if (code <= 2) return "It's Partly Cloudy Today";
    if (code === 3) return "It's Cloudy Today";
    if (code <= 67) return "It's Rainy Today";
    if (code <= 99) return "There's a Thunderstorm Today";
    return 'Interesting Weather Today';
}
function getWeatherName(code) {
    if (code === 0) return "sunny";
    if (code <= 2) return "fair";
    if (code === 3) return "cloudy";
    if (code <= 67) return "rainy";
    if (code <= 99) return "stormy";
    return 'Interesting Weather Today';
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
        <div className='weather-card my-small'>
            <div className='weather-icon flex justify-center items-center' aria-hidden='true'>
                <Icon name={getWeatherName(today.code)} size='large'/>
            </div>
            <div className='weather-copy'>
                <Heading className='fw-extra-bold text-white'>{getWeatherLabel(today.code)}</Heading>
                <Heading className='text-white'>{dayName}</Heading>
            </div>
        </div>
    );
}   

export default WeatherView;
