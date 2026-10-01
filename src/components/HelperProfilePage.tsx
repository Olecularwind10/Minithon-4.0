import { ArrowLeft, Check, HeartHandshake, MapPin, ShieldCheck, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { HelperProfile } from '../types/helper'

type HelperProfilePageProps = {
  helper?: HelperProfile
}

export default function HelperProfilePage({ helper }: HelperProfilePageProps) {
  if (!helper) {
    return <div className="page-enter mx-auto max-w-[680px] rounded-[24px] border border-line bg-surface px-6 py-14 text-center text-sm text-muted">Helper profile not found.</div>
  }

  return (
    <div className="page-enter mx-auto max-w-[680px]">
      <Link to="/discover" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted no-underline"><ArrowLeft size={17} /> Back to discover</Link>
      <section className="rounded-[26px] bg-[#292d27] p-5 text-white shadow-[0_16px_36px_rgba(39,41,34,0.12)] sm:p-7">
        <div className="flex items-start gap-4">
          <img src={helper.avatar} alt="" className="size-20 rounded-full object-cover ring-4 ring-white/15" />
          <div className="min-w-0 flex-1"><h1 className="text-[25px] font-bold text-white">{helper.name}</h1><p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/65"><MapPin size={15} /> {helper.locationLabel} · within {helper.serviceRadiusKm} km</p><p className="mt-3 text-sm leading-relaxed text-white/75">{helper.bio}</p></div>
        </div>
        <div className="mt-6 grid grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-5 text-center"><div><p className="inline-flex items-center gap-1 text-xl font-bold text-white"><Star size={17} className="fill-current text-[#f09a7f]" /> {helper.ratingAverage.toFixed(1)}</p><p className="mt-1 text-xs text-white/60">{helper.ratingCount} ratings</p></div><div><p className="text-xl font-bold text-white">{helper.completedHelps}</p><p className="mt-1 text-xs text-white/60">Completed helps</p></div><div><p className="inline-flex items-center gap-1 text-xl font-bold text-white">{helper.verified && <ShieldCheck size={17} />} {helper.verified ? 'Yes' : 'No'}</p><p className="mt-1 text-xs text-white/60">Verified</p></div></div>
      </section>
      <section className="section-rule mt-7 pt-6"><div className="flex items-center gap-2"><HeartHandshake size={19} className="text-accent" /><h2 className="text-lg font-bold text-ink">Skills I can share</h2></div><div className="mt-4 flex flex-wrap gap-2">{helper.skills.map((skill) => <span key={skill} className="rounded-full bg-accent-soft px-3.5 py-2 text-sm font-semibold text-accent">{skill}</span>)}</div></section>
      <section className="section-rule mt-7 pt-6"><h2 className="text-lg font-bold text-ink">Availability</h2><div className="mt-3 grid gap-2">{helper.availability.map((slot) => <div key={`${slot.day}-${slot.start}`} className="flex items-center gap-2 rounded-xl bg-surface-soft px-3 py-2 text-sm text-muted"><Check size={15} className="text-accent" /> {slot.day}, {slot.start} - {slot.end}</div>)}</div></section>
    </div>
  )
}
