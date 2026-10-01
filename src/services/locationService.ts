import {
  MUMBAI_FALLBACK_LOCATION,
  type LocationCoordinates,
} from '../types/location'

export type LocationErrorReason =
  | 'permission-denied'
  | 'position-unavailable'
  | 'timeout'
  | 'unsupported'

export function getLocationErrorReason(error?: GeolocationPositionError): LocationErrorReason {
  if (!error) return 'unsupported'
  if (error.code === error.PERMISSION_DENIED) return 'permission-denied'
  if (error.code === error.TIMEOUT) return 'timeout'
  return 'position-unavailable'
}

export function getCurrentLocation(): Promise<LocationCoordinates> {
  if (!('geolocation' in navigator)) {
    return Promise.resolve(MUMBAI_FALLBACK_LOCATION)
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      () => resolve(MUMBAI_FALLBACK_LOCATION),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  })
}
