import { MapPin } from 'lucide-react'
import type { HelpRequest } from '../App'
import {
  Map as MapCanvas,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
} from './ui/map'

const neighborhoodCenter: [number, number] = [-74.229, 40.8529]
const requestLocations: [number, number][] = [
  [-74.2317, 40.8562],
  [-74.2248, 40.8504],
  [-74.2332, 40.8489],
  [-74.2228, 40.8551],
  [-74.2261, 40.8581],
]

export default function NeighborhoodRequestMap({ requests }: { requests: HelpRequest[] }) {
  return (
    <section className="map-panel overflow-hidden rounded-[24px] border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-sm font-bold text-ink">Cedar Grove</h2>
          <p className="mt-0.5 text-xs text-muted">A few blocks around you</p>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent">{requests.length} nearby</span>
      </div>
      <MapCanvas center={neighborhoodCenter} zoom={14.5} className="discover-map">
        <MapControls showCompass />
        {requests.map((request, index) => {
          const [longitude, latitude] = requestLocations[index % requestLocations.length]
          return (
            <MapMarker key={request.id} longitude={longitude} latitude={latitude} anchor="bottom">
              <MarkerContent>
                <span className="neighborhood-pin" aria-label={`Request ${index + 1}`}>
                  <span className="neighborhood-pin-number">{index + 1}</span>
                </span>
              </MarkerContent>
              <MarkerPopup closeButton>
                <div className="map-request-popup">
                  <strong>{request.title}</strong>
                  <span>{request.category} / {request.distance} away</span>
                </div>
              </MarkerPopup>
            </MapMarker>
          )
        })}
      </MapCanvas>
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-[11px] text-muted sm:px-5">
        <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> Locations are approximate</span>
        <span>Map data © OpenStreetMap</span>
      </div>
    </section>
  )
}