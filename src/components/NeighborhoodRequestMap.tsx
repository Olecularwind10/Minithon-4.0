import { LocateFixed, MapPin, Search } from 'lucide-react'
import { useState } from 'react'
import type { LocationCoordinates } from '../types/location'
import type { EnrichedHelpRequest } from '../types/request'
import { calculateDistance } from '../utils/distance'
import { formatRequestDate } from '../utils/locationFilters'
import {
  Map as MapCanvas,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
} from './ui/map'

type NeighborhoodRequestMapProps = {
  requests: EnrichedHelpRequest[]
  userLocation: LocationCoordinates
  onSearchThisArea: (requestIds: string[]) => void
}

export default function NeighborhoodRequestMap({ requests, userLocation, onSearchThisArea }: NeighborhoodRequestMapProps) {
  const [locatedUser, setLocatedUser] = useState<LocationCoordinates | null>(null)
  const [viewport, setViewport] = useState({
    center: [userLocation.longitude, userLocation.latitude] as [number, number],
    zoom: 13,
  })
  const [hasMoved, setHasMoved] = useState(false)

  function searchThisArea() {
    const [longitude, latitude] = viewport.center
    const visibleRadiusKm = Math.max(1, 80 / 2 ** viewport.zoom)
    const requestIds = requests
      .filter((request) => calculateDistance(latitude, longitude, request.latitude, request.longitude) <= visibleRadiusKm)
      .map((request) => request.id)
    onSearchThisArea(requestIds)
    setHasMoved(false)
  }

  return (
    <section className="map-panel overflow-hidden rounded-[24px] border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-sm font-bold text-ink">Mumbai nearby</h2>
          <p className="mt-0.5 text-xs text-muted">Requests around your approximate location</p>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent">{requests.length} nearby</span>
      </div>
      <div className="relative">
        <MapCanvas
          center={viewport.center}
          zoom={viewport.zoom}
          viewport={viewport}
          onViewportChange={(nextViewport) => {
            setViewport(nextViewport)
            setHasMoved(true)
          }}
          className="discover-map"
        >
          <MapControls
            showCompass
            showLocate
            onLocate={(coordinates) => {
              const nextLocation = { latitude: coordinates.latitude, longitude: coordinates.longitude }
              setLocatedUser(nextLocation)
              setViewport((current) => ({ ...current, center: [nextLocation.longitude, nextLocation.latitude], zoom: 13 }))
            }}
          />
          <MapMarker longitude={(locatedUser ?? userLocation).longitude} latitude={(locatedUser ?? userLocation).latitude} anchor="center">
            <MarkerContent>
              <span className="user-location-pin" aria-label="Your approximate location"><LocateFixed size={17} /></span>
            </MarkerContent>
          </MapMarker>
          {requests.map((request, index) => (
            <MapMarker key={request.id} longitude={request.longitude} latitude={request.latitude} anchor="bottom">
              <MarkerContent>
                <span className="neighborhood-pin" aria-label={`Request ${index + 1}`}>
                  <span className="neighborhood-pin-number">{index + 1}</span>
                </span>
              </MarkerContent>
              <MarkerPopup closeButton className="map-request-popup-shell">
                <div className="map-request-popup">
                  <strong className="map-request-popup-title">{request.title}</strong>
                  <span className="map-request-popup-category">{request.category}</span>
                  <div className="map-request-popup-details">
                    <span>{request.distanceKm.toFixed(1)} km away</span>
                    <span>{request.urgency} urgency</span>
                    <span>{formatRequestDate(request.date, request.time)}</span>
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}
        </MapCanvas>
        {hasMoved && (
          <button type="button" onClick={searchThisArea} className="search-area-button inline-flex items-center gap-1.5 rounded-full bg-action px-3.5 py-2 text-xs font-bold text-white shadow-lg">
            <Search size={14} /> Search this area
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-[11px] text-muted sm:px-5">
        <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> Mumbai locations are approximate</span>
        <span>Map data © OpenStreetMap</span>
      </div>
    </section>
  )
}