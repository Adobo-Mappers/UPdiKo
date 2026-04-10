import { WeatherWidget } from "@daniel-szulc/react-weather-widget"

const WeatherView = () => {
    return (
        <WeatherWidget
        provider='openWeather'
        apiKey={import.meta.env.VITE_OPENWEATHERMAP_API_KEY}
        location='Miagao'
        tempUnit="C"
        windSpeedUnit="kmph"
        lang="en"
        />
    )}

export default WeatherView;