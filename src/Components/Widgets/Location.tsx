import { useEffect, useState } from 'react'
import { t } from '@/i18n'
import { fetchLocation } from '@/services'

interface LocationProps {
  readonly mode: 'auto' | 'manual'
  readonly city: string
}

const Location: React.FC<LocationProps> = ({ mode, city }) => {
  const [cityName, setCityName] = useState<string>('')
  const [hasError, setHasError] = useState<boolean>(false)

  useEffect(() => {
    let active = true
    setHasError(false)
    setCityName('')
    fetchLocation(mode, city)
      .then((place) => {
        if (active) setCityName(place.city)
      })
      .catch(() => {
        // Safe: Network or geocoding resolution error is presented as localized user error state
        if (active) setHasError(true)
      })
    return () => {
      active = false
    }
  }, [mode, city])

  if (hasError) return <div className="widget-location">{t`location.error`}</div>
  if (!cityName) return <div className="widget-location">{t`location.loading`}</div>

  return (
    <div className="widget-location">
      <span className="widget-location-icon">📍</span>
      <span className="widget-location-name">{cityName}</span>
    </div>
  )
}

export default Location
