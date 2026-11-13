export interface ResolvedLocation {
  readonly city: string
  readonly latitude: number
  readonly longitude: number
}

export interface CurrentWeather {
  readonly temperature: number
  readonly apparentTemperature: number
  readonly humidity: number
  readonly weatherCode: number
}

interface CacheItem<T> {
  readonly timestamp: number
  readonly value: T
}

interface GeocodingResult {
  readonly name: string
  readonly latitude: number
  readonly longitude: number
}

interface GeocodingPayload {
  readonly results?: readonly GeocodingResult[]
}

interface GeoJsPayload {
  readonly city?: string
  readonly region?: string
  readonly country?: string
  readonly latitude?: string | number
  readonly longitude?: string | number
}

interface OpenMeteoPayload {
  readonly current?: {
    readonly temperature_2m: number
    readonly apparent_temperature: number
    readonly relative_humidity_2m: number
    readonly weather_code: number
  }
}

const readStorageCache = <T>(key: string, ttl: number): T | null => {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  const parsed = JSON.parse(raw) as CacheItem<T>
  if (Date.now() - parsed.timestamp > ttl) return null
  return parsed.value
}

const saveStorageCache = <T>(key: string, value: T): void =>
  localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), value }))

export const fetchLocation = async (mode: 'auto' | 'manual', city: string): Promise<ResolvedLocation> => {
  const normalizedCity = city.trim()
  const cacheKey = `senatab_location_${mode}_${encodeURIComponent(normalizedCity)}`
  const cached = readStorageCache<ResolvedLocation>(cacheKey, 12 * 60 * 60 * 1000)
  if (cached) return cached
  if (mode === 'manual' && normalizedCity.length > 0) {
    const payload = (await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalizedCity)}&count=1&language=en&format=json`
    ).then((res) => res.json())) as GeocodingPayload
    if (payload.results && payload.results.length > 0) {
      const location: ResolvedLocation = {
        city: payload.results[0].name,
        latitude: payload.results[0].latitude,
        longitude: payload.results[0].longitude
      }
      saveStorageCache(cacheKey, location)
      return location
    }
  }
  const geo = (await fetch('https://get.geojs.io/v1/ip/geo.json').then((res) => res.json())) as GeoJsPayload
  const location: ResolvedLocation = {
    city: geo.city ?? geo.region ?? geo.country ?? 'Unknown',
    latitude: Number(geo.latitude),
    longitude: Number(geo.longitude)
  }
  if (mode === 'auto') saveStorageCache(cacheKey, location)
  return location
}

export const fetchWeather = async (
  latitude: number,
  longitude: number,
  unit: 'celsius' | 'fahrenheit'
): Promise<CurrentWeather> => {
  const cacheKey = `senatab_weather_${latitude.toFixed(2)}_${longitude.toFixed(2)}_${unit}`
  const cached = readStorageCache<CurrentWeather>(cacheKey, 30 * 60 * 1000)
  if (cached) return cached
  const payload = (await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&temperature_unit=${unit}&timezone=auto`
  ).then((res) => res.json())) as OpenMeteoPayload
  if (!payload.current) throw new Error(`Weather fetch failed for coordinates (${latitude}, ${longitude})`)
  const weather: CurrentWeather = {
    temperature: Math.round(payload.current.temperature_2m),
    apparentTemperature: Math.round(payload.current.apparent_temperature),
    humidity: payload.current.relative_humidity_2m,
    weatherCode: payload.current.weather_code
  }
  saveStorageCache(cacheKey, weather)
  return weather
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
