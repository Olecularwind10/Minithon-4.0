import { ArrowLeft, Check, Clock3, HeartHandshake, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { LocationCoordinates } from '../types/location'
import type { HelperProfile } from '../types/helper'
import type { HelpRequest } from '../types/request'
import { getRecommendedHelpers } from '../services/matchingService'
import { enrichRequests, formatRequestDate } from '../utils/locationFilters'

type RequestDetailsPageProps = {
  request?: HelpRequest
  helpers: HelperProfile[]
  userLocation: LocationCoordinates | null
  offered: boolean
  onOffer: (id: string) => void
}

export default function RequestDetailsPage({ request, helpers, userLocation, offered, onOffer }: RequestDetailsPageProps) {
  if (!request) {
    return (
      <div className="page-enter mx-auto max-w-[680px] rounded-[24px] border border-line bg-surface px-6 py-14 text-center">
        <h1 className="text-xl font-bold text-ink">Request not found</h1>
        <Link to="/discover" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-accent no-underline"><ArrowLeft size={16} /> Back to discover</Link>
      </div>
    )
  }

  const activeLocation = userLocation ?? { latitude: 19.0176, longitude: 72.8562 }
  const enrichedRequest = enrichRequests([request], activeLocation)[0]
  const matches = getRecommendedHelpers(request, helpers)

  return (
    <div className="page-enter mx-auto max-w-[860px]">
      <Link to="/discover" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted no-underline"><ArrowLeft size={17} /> Back to discover</Link>
      <div className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_12px_36px_rgba(39,41,34,0.05)] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent">{request.category}</span>
              <h1 className="mt-4 text-[28px] font-bold leading-tight tracking-[-0.6px] text-ink">{request.title}</h1>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${request.urgency === 'Urgent' ? 'bg-[#fbe0da] text-[#a53d2a]' : 'bg-surface-soft text-muted'}`}>{request.urgency}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">{request.description}</p>
          <div className="mt-6 grid gap-3 border-y border-line py-4 text-sm text-muted sm:grid-cols-2">
            <span className="inline-flex items-center gap-2"><Clock3 size={16} className="text-accent" /> {formatRequestDate(request.date, request.time)}</span>
            <span className="inline-flex items-center gap-2"><MapPin size={16} className="text-accent" /> {enrichedRequest.distanceKm.toFixed(1)} km away</span>
            <span className="inline-flex items-center gap-2"><MapPin size={16} className="text-accent" /> Near {request.locationLabel}</span>
          </div>
          <div className="mt-5 rounded-2xl bg-surface-soft p-4">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Requested by</p>
            <div className="mt-3 flex items-center gap-3">
              <img src={request.avatar} alt="" className="size-11 rounded-full object-cover" />
              <div><p className="font-bold text-ink">{request.name}</p><p className="text-xs text-muted">Mumbai neighbor · verified profile</p></div>
              <Link to="/profile" className="ml-auto text-xs font-bold text-accent no-underline">View profile</Link>
            </div>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-muted">Location is approximate. Exact details can be shared after the request is accepted.</p>
          <button type="button" onClick={() => onOffer(request.id)} disabled={offered} className={`mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold ${offered ? 'bg-accent-soft text-accent' : 'bg-action text-white'}`}>
            {offered ? <Check size={17} /> : <HeartHandshake size={17} />}
            {offered ? 'Offer sent' : 'Offer to help'}
          </button>
        </section>

        <section>
          <div className="mb-3">
            <p className="text-sm font-semibold text-accent">Location, skills, availability, and trust</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Recommended helpers</h2>
          </div>
          <div className="grid gap-3">
            {matches.length > 0 ? matches.map((match) => (
              <article key={match.helper.userId} className="rounded-[20px] border border-line bg-surface p-4 shadow-[0_8px_24px_rgba(39,41,34,0.04)]">
                <div className="flex items-start gap-3">
                  <img src={match.helper.avatar} alt="" className="size-11 rounded-full object-cover" />
                  <div className="min-w-0 flex-1"><p className="font-bold text-ink">{match.helper.name}</p><p className="mt-0.5 text-xs text-muted">{match.helper.ratingAverage.toFixed(1)} rating · {match.helper.completedHelps} completed helps</p></div>
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">{Math.round(match.score * 100)}% match</span>
                </div>
                <div className="mt-3 grid gap-1.5 text-xs text-muted">
                  {match.reasons.positive.slice(0, 4).map((reason) => <span key={reason} className="inline-flex items-center gap-1.5"><Check size={13} className="text-accent" /> {reason}</span>)}
                  {match.reasons.caveats.slice(0, 1).map((reason) => <span key={reason} className="inline-flex items-center gap-1.5 text-[#9a6b2f]"><Clock3 size={13} /> {reason}</span>)}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                  <Link to={`/profile/${match.helper.userId}`} className="text-xs font-bold text-accent no-underline">View profile</Link>
                  <button type="button" onClick={() => onOffer(request.id)} disabled={offered} className="inline-flex items-center gap-1.5 rounded-full bg-action px-3 py-2 text-xs font-bold text-white disabled:bg-accent-soft disabled:text-accent">{offered ? <Check size={13} /> : <HeartHandshake size={13} />} {offered ? 'Offered' : 'Offer'}</button>
                </div>
              </article>
            )) : <div className="rounded-[20px] border border-line bg-surface px-5 py-10 text-center text-sm text-muted">No available helpers match this request time yet.</div>}
          </div>
        </section>
      </div>
    </div>
  )
}
