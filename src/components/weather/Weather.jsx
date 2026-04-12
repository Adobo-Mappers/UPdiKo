import { useState, useEffect } from 'react';

const WeatherView = () => {
    const [forecast, setForecast] = useState(null);

    const getWeatherDescription = (code) => {
        const descriptions = {
            0: "Clear sky",
            1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
            45: "Fog", 48: "Rime fog",
            51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
            56: "Light freezing drizzle", 57: "Heavy freezing drizzle",
            61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
            66: "Light freezing rain", 67: "Heavy freezing rain",
            71: "Slight snowfall", 73: "Moderate snowfall", 75: "Heavy snowfall",
            77: "Snow grains",
            80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
            85: "Slight snow showers", 86: "Heavy snow showers",
            95: "Thunderstorm",
            96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
        };
        return descriptions[code] ?? "Unknown";
    };

    useEffect(() => {
        console.log("Fetching 7-day forecast for Miagao...");

        fetch(import.meta.env.VITE_OPENMETEO_API_URL)
            .then(res => {
                console.log("Response status:", res.status);
                return res.json();
            })
            .then(data => {
                console.log("Full raw data:", data);
                console.log("Daily forecast object:", data.daily);

                data.daily.time.forEach((date, i) => {
                    console.log(
                        `Day ${i + 1} | Date: ${date} |

Temperature:
High: ${data.daily.temperature_2m_max[i]}°C |
Low: ${data.daily.temperature_2m_min[i]}°C |
Weather description: ${getWeatherDescription(data.daily.weathercode[i])}

Precipitation:
Chance of rain: ${Array.isArray(data.daily.precipitation_probability_max) ? data.daily.precipitation_probability_max[i] + "%" : "N/A"}

Wind:
Max wind speed: ${Array.isArray(data.daily.windspeed_10m_max) ? data.daily.windspeed_10m_max[i] + " km/h" : "N/A"}
                        `
                    );
                });

                setForecast(data.daily);
            })
            .catch(err => console.error("Fetch error:", err));
    }, []);

    return (
        <div>
            <h2>7-Day Forecast for Miagao</h2>
            {forecast ? (
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {forecast.time.map((date, i) => (
                        <div key={date} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                            <p><strong>{date}</strong></p>
                            <p>High: {forecast.temperature_2m_max[i]}°C</p>
                            <p>Low: {forecast.temperature_2m_min[i]}°C</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default WeatherView;

/*

You can request additional fields by adding them between the daily= parameter and the &timezone= parameter in the URL in the .env file.
Make sure to add commas in between for multiple fields. Here are the available ones:

Temperature
Code                            Description
temperature_2m_max              Max temperature (°C)
temperature_2m_min              Min temperature (°C)
apparent_temperature_max        Feels-like max
apparent_temperature_min        Feels-like min
weathercode                     WMO weather code

Precipitation
Code                            Description
precipitation_sum               Total rainfall (mm)
rain_sum                        Rain only (mm)
showers_sum                     Showers only (mm)
snowfall_sum                    Snowfall (cm)
precipitation_hours             Hours of precipitation
precipitation_probability_max   Chance of rain (%)

Wind
Code                            Description
windspeed_10m_max               Max wind speed
windgusts_10m_max               Max wind gust
winddirection_10m_dominant      Dominant wind direction (°)

Sun
Code                            Description
sunrise                         Sunrise time
sunset                          Sunset time
sunshine_duration               Seconds of sunshine
uv_index_max                    Max UV index

Other
Code                            Description
weathercode                     WMO weather code
et0_fao_evapotranspiration      Evapotranspiration (mm)
shortwave_radiation_sum         Solar radiation (MJ/m²)

*/