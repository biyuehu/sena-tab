import { useEffect, useState } from 'react'
import { f, t } from '@/i18n'
import type { CurrentWeather } from '@/services'
import { fetchLocation, fetchWeather, getWeatherDescriptionKey } from '@/services'
import type { Settings } from '@/store/schema'

interface WeatherProps {
  readonly unit: 'celsius' | 'fahrenheit'
  readonly mode: 'auto' | 'manual'
  readonly city: string
  readonly showDetails: boolean
  readonly language: Settings['language']
}

const Weather: React.FC<WeatherProps> = ({ unit, mode, city, showDetails, language }) => {
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [cityName, setCityName] = useState<string>('')
  const [hasError, setHasError] = useState<boolean>(false)

  useEffect(() => {
    let active = true
    setHasError(false)
    setWeather(null)
    const load = async (): Promise<void> => {
      try {
        const place = await fetchLocation(mode, city, language)
        const current = await fetchWeather(place.latitude, place.longitude, unit)
        if (!active) return
        setCityName(place.city)
        setWeather(current)
      } catch {
        // Safe: Network or weather resolution error is presented as localized user error state
        if (active) setHasError(true)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [unit, mode, city, language])

  if (hasError) return <div className="widget-weather">{t`weather.error`}</div>
  if (!weather) return <div className="widget-weather">{t`weather.loading`}</div>

  const condition = getWeatherDescriptionKey(weather.weatherCode)
  const unitSymbol = unit === 'fahrenheit' ? '°F' : '°C'

  return (
    <div className="widget-weather">
      <div className="widget-weather-main">
        <span className="widget-weather-icon">{condition.icon}</span>
        <span className="widget-weather-temp">
          {weather.temperature}
          {unitSymbol}
        </span>
        <span className="widget-weather-desc">{f(condition.key)}</span>
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
