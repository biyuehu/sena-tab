import { useEffect, useState } from 'react'
import { f, t } from '@/i18n'
import type { WeatherData } from '@/services/geo'
import { fetchLocation, fetchWeather, getWeatherDescriptionKey } from '@/services/geo'

interface WeatherProps {
  readonly unit: 'celsius' | 'fahrenheit'
  readonly mode: 'auto' | 'manual'
  readonly city: string
  readonly showDetails: boolean
}

const Weather: React.FC<WeatherProps> = ({ unit, mode, city, showDetails }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [cityName, setCityName] = useState<string>('')
  const [hasError, setHasError] = useState<boolean>(false)

  useEffect(() => {
    let active = true
    setHasError(false)
    setWeather(null)
    const load = async (): Promise<void> => {
      try {
        const location = await fetchLocation(mode, city)
        const data = await fetchWeather(location.latitude, location.longitude, unit)
        if (!active) return
        setCityName(location.city)
        setWeather(data)
      } catch {
        if (active) setHasError(true)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [unit, mode, city])

  if (hasError) return <div className="widget-weather">{t`weather.error`}</div>
  if (!weather) return <div className="widget-weather">{t`weather.loading`}</div>

  const info = getWeatherDescriptionKey(weather.weatherCode)
  const unitSymbol = unit === 'fahrenheit' ? '°F' : '°C'

  return (
    <div className="widget-weather">
      <div className="widget-weather-main">
        <span className="widget-weather-icon">{info.icon}</span>
        <span className="widget-weather-temp">
          {weather.temperature}
          {unitSymbol}
        </span>
        <span className="widget-weather-desc">{f(info.key)}</span>
        {cityName && <span className="widget-weather-city">{cityName}</span>}
      </div>
      {showDetails && (
        <div className="widget-weather-details">
          <span>{f('weather.feelsLike', `${weather.apparentTemperature}${unitSymbol}`)}</span>
          <span>{f('weather.humidity', `${weather.humidity}%`)}</span>
        </div>
      )}
    </div>
  )
}

export default Weather
