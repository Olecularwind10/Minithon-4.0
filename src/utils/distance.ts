const EARTH_RADIUS_KM = 6371

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

export function calculateDistance(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const latitudeDelta = toRadians(latitude2 - latitude1)
  const longitudeDelta = toRadians(longitude2 - longitude1)
  const firstLatitude = toRadians(latitude1)
  const secondLatitude = toRadians(latitude2)
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine))
}
