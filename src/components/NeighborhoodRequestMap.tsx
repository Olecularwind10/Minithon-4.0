import { LocateFixed, MapPin, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LocationCoordinates } from '../types/location'
import type { HelperProfile } from '../types/helper'
import type { EnrichedHelpRequest } from '../types/request'
import { calculateDistance } from '../utils/distance'
import { formatRequestDate } from '../utils/locationFilters'
import {
  Map as MapCanvas,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  useMap,
} from './ui/map'

type NeighborhoodRequestMapProps = {
  requests: EnrichedHelpRequest[]
  helpers?: HelperProfile[]
  userLocation: LocationCoordinates
  onSearchThisArea: (requestIds: string[]) => void
}

function RequestMarker({ request, index, onViewRequest }: { request: EnrichedHelpRequest; index: number; onViewRequest: (id: string) => void }) {
  const { map } = useMap()

  return (
    <MapMarker
      longitude={request.longitude}
      latitude={request.latitude}
      anchor="bottom"
      onClick={() => map?.panTo([request.longitude, request.latitude], { duration: 250 })}
    >
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
          <button type="button" onClick={() => onViewRequest(request.id)} className="map-request-popup-action">View request</button>
        </div>
      </MarkerPopup>
    </MapMarker>
  )
}

function HelperMarker({ helper, userLocation, onViewProfile }: { helper: HelperProfile; userLocation: LocationCoordinates; onViewProfile: (id: string) => void }) {
  const { map } = useMap()
  const distanceKm = calculateDistance(userLocation.latitude, userLocation.longitude, helper.latitude, helper.longitude)

  return (
    <MapMarker
      longitude={helper.longitude}
      latitude={helper.latitude}
      anchor="center"
      onClick={() => map?.panTo([helper.longitude, helper.latitude], { duration: 250 })}
    >
      <MarkerContent>
        <span className="helper-map-pin" aria-label={`${helper.name}, helper`}><LocateFixed size={14} /></span>
      </MarkerContent>
      <MarkerPopup closeButton className="map-request-popup-shell">
        <div className="map-request-popup">
          <strong className="map-request-popup-title">{helper.name}</strong>
          <span className="map-request-popup-category">Available helper</span>
          <div className="map-request-popup-details">
            <span>{distanceKm.toFixed(1)} km away</span>
            <span>{helper.locationLabel}</span>
            <span>{helper.skills.slice(0, 2).join(' · ') || 'Community support'}</span>
          </div>
          <button type="button" onClick={() => onViewProfile(helper.userId)} className="map-request-popup-action">View profile</button>
        </div>
      </MarkerPopup>
    </MapMarker>
  )
}

export default function NeighborhoodRequestMap({ requests, helpers = [], userLocation, onSearchThisArea }: NeighborhoodRequestMapProps) {
  const navigate = useNavigate()
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
      <div className="map-panel-header flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-sm font-bold text-ink">Mumbai nearby</h2>
          <p className="mt-0.5 text-xs text-muted">Requests around your approximate location</p>
        </div>
        <div className="map-panel-actions">
          {hasMoved && <button type="button" onClick={searchThisArea} className="search-area-button inline-flex items-center gap-1.5 rounded-full bg-action px-3 py-1.5 text-xs font-bold text-white"><Search size={14} /> Search area</button>}
          <span className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent">{requests.length} requests · {helpers.length} helpers</span>
        </div>
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
            position="bottom-left"
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
          {requests.map((request, index) => <RequestMarker key={request.id} request={request} index={index} onViewRequest={(id) => navigate(`/requests/${id}`)} />)}
          {helpers.map((helper) => <HelperMarker key={helper.userId} helper={helper} userLocation={userLocation} onViewProfile={(id) => navigate(`/profile/${id}`)} />)}
        </MapCanvas>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-[11px] text-muted sm:px-5">
        <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> Mumbai locations are approximate</span>
        <span>Map data © OpenStreetMap</span>
      </div>
    </section>
  )
}