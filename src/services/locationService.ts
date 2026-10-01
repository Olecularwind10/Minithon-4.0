import {
  MUMBAI_FALLBACK_LOCATION,
  type LocationCoordinates,
} from '../types/location'

export type LocationErrorReason =
  | 'permission-denied'
  | 'position-unavailable'
  | 'timeout'
  | 'unsupported'

export type LocationResult = {
  location: LocationCoordinates
  source: 'browser' | 'fallback'
  reason?: LocationErrorReason
}

export function getLocationErrorReason(error?: GeolocationPositionError): LocationErrorReason {
  if (!error) return 'unsupported'
  if (error.code === error.PERMISSION_DENIED) return 'permission-denied'
  if (error.code === error.TIMEOUT) return 'timeout'
  return 'position-unavailable'
}

export function getCurrentLocation(): Promise<LocationResult> {
  if (!('geolocation' in navigator)) {
    return Promise.resolve({ location: MUMBAI_FALLBACK_LOCATION, source: 'fallback', reason: 'unsupported' })
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        location: { latitude: position.coords.latitude, longitude: position.coords.longitude },
        source: 'browser',
      }),
      (error) => resolve({ location: MUMBAI_FALLBACK_LOCATION, source: 'fallback', reason: getLocationErrorReason(error) }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    )
  })
}
