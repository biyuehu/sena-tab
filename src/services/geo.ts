export interface LocationData {
  readonly city: string
  readonly latitude: number
  readonly longitude: number
}

export interface WeatherData {
  readonly temperature: number
  readonly apparentTemperature: number
  readonly humidity: number
  readonly weatherCode: number
}

interface CacheItem<T> {
  readonly timestamp: number
  readonly data: T
}

const readStorageCache = <T>(key: string, ttl: number): T | null => {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  const parsed = JSON.parse(raw) as CacheItem<T>
  if (Date.now() - parsed.timestamp > ttl) return null
  return parsed.data
}

const writeStorageCache = <T>(key: string, data: T): void =>
  localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }))

export const fetchLocation = async (mode: 'auto' | 'manual', city: string): Promise<LocationData> => {
  const normalizedCity = city.trim()
  const cacheKey = `senatab_location_${mode}_${encodeURIComponent(normalizedCity)}`
  const cached = readStorageCache<LocationData>(cacheKey, 12 * 60 * 60 * 1000)
  if (cached) return cached
  if (mode === 'manual' && normalizedCity.length > 0) {
    const data = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalizedCity)}&count=1&language=en&format=json`
    ).then((res) => res.json())
    if (data.results && data.results.length > 0) {
      const result: LocationData = {
        city: data.results[0].name,
        latitude: data.results[0].latitude,
        longitude: data.results[0].longitude
      }
      writeStorageCache(cacheKey, result)
      return result
    }
  }
  const geo = await fetch('https://get.geojs.io/v1/ip/geo.json').then((res) => res.json())
  const result: LocationData = {
    city: geo.city ? geo.city : geo.region ? geo.region : geo.country ? geo.country : 'Unknown',
    latitude: Number(geo.latitude),
    longitude: Number(geo.longitude)
  }
  if (mode === 'auto') writeStorageCache(cacheKey, result)
  return result
}

export const fetchWeather = async (
  latitude: number,
  longitude: number,
  unit: 'celsius' | 'fahrenheit'
): Promise<WeatherData> => {
  const cacheKey = `senatab_weather_${latitude.toFixed(2)}_${longitude.toFixed(2)}_${unit}`
  const cached = readStorageCache<WeatherData>(cacheKey, 30 * 60 * 1000)
  if (cached) return cached
  const json = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&temperature_unit=${unit}&timezone=auto`
  ).then((res) => res.json())
  const result: WeatherData = {
    temperature: Math.round(json.current.temperature_2m),
    apparentTemperature: Math.round(json.current.apparent_temperature),
    humidity: json.current.relative_humidity_2m,
    weatherCode: json.current.weather_code
  }
  writeStorageCache(cacheKey, result)
  return result
}

export const getWeatherDescriptionKey = (code: number): { readonly icon: string; readonly key: string } => {
  if (code === 0) return { icon: '☀️', key: 'weather.clear' }
  if (code === 1 || code === 2) return { icon: '⛅', key: 'weather.partlyCloudy' }
  if (code === 3) return { icon: '☁️', key: 'weather.cloudy' }
  if (code === 45 || code === 48) return { icon: '🌫️', key: 'weather.fog' }
  if (code >= 51 && code <= 57) return { icon: '🌦️', key: 'weather.drizzle' }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { icon: '🌧️', key: 'weather.rain' }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return { icon: '🌨️', key: 'weather.snow' }
  if (code >= 95 && code <= 99) return { icon: '⛈️', key: 'weather.thunderstorm' }
  return { icon: '🌤️', key: 'weather.clear' }
}
