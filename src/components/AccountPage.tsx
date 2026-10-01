import { useEffect, useState, type FormEvent } from 'react'
import { Check, LogOut, MailCheck, MapPin, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import {
  createOffer,
  deleteOffer,
  fetchOffers,
  resendEmailCode,
  updateCurrentUser,
  updateOffer,
  verifyCommunity,
  verifyEmail,
  type AuthUser,
  type HelpOffer,
  type OfferDraft,
} from '../lib/api'
import type { LocationCoordinates } from '../types/location'

export default function AccountPage({ user, location, onUserUpdated, onLogout }: {
  user: AuthUser
  location: LocationCoordinates
  onUserUpdated: (user: AuthUser) => void
  onLogout: () => void
}) {
  const [offers, setOffers] = useState<HelpOffer[]>([])
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [area, setArea] = useState(user.area ?? '')
  const [otp, setOtp] = useState('')
  const [communityCode, setCommunityCode] = useState('')
  const [category, setCategory] = useState('Groceries')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState('')
  const [offerBusy, setOfferBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setName(user.name)
    setPhone(user.phone ?? '')
    setArea(user.area ?? '')
    fetchOffers(user.id).then(setOffers).catch((requestError: unknown) => {
      setError(requestError instanceof Error ? requestError.message : 'Could not load offers')
    })
  }, [user])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await updateCurrentUser(user.id, { name: name.trim(), phone: phone.trim(), area: area.trim() })
      onUserUpdated(result.user)
      setNotice('Profile saved.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save your profile')
    } finally {
      setBusy(false)
    }
  }

  async function submitOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await verifyEmail(user.id, otp)
      onUserUpdated(result.user)
      setOtp('')
      setNotice(result.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not verify email')
    } finally {
      setBusy(false)
    }
  }

  async function resendCode() {
    setBusy(true)
    setError('')
    try {
      const result = await resendEmailCode(user.id)
      setNotice(result.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not resend code')
    } finally {
      setBusy(false)
    }
  }

  async function submitCommunityCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await verifyCommunity(communityCode)
      onUserUpdated(result.user)
      setCommunityCode('')
      setNotice(result.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not verify community')
    } finally {
      setBusy(false)
    }
  }

  async function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOfferBusy(true)
    setError('')
    try {
      const draft: OfferDraft = {
        category,
        description: description.trim(),
        skills: skills.split(',').map((skill) => skill.trim()).filter(Boolean),
        latitude: location.latitude,
        longitude: location.longitude,
        serviceRadius: 5,
        availability: ['weekends', 'evenings'],
      }
      const offer = await createOffer(draft)
      setOffers((current) => [offer, ...current])
      setDescription('')
      setSkills('')
      setNotice('Your help offer is live.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not create offer')
    } finally {
      setOfferBusy(false)
    }
  }

  async function toggleOffer(offer: HelpOffer) {
    try {
      const updated = await updateOffer(offer.id, { status: offer.status === 'active' ? 'paused' : 'active' })
      setOffers((current) => current.map((item) => item.id === offer.id ? updated : item))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update offer')
    }
  }

  async function removeOffer(offerId: string) {
    try {
      await deleteOffer(offerId)
      setOffers((current) => current.filter((offer) => offer.id !== offerId))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not delete offer')
    }
  }

  return (
    <div className="page-enter mx-auto max-w-[760px]">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-accent">Your account</p>
          <h1 className="mt-1 text-[30px] font-bold leading-tight text-ink">{user.name}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <button type="button" onClick={onLogout} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ink"><LogOut size={16} /> Sign out</button>
      </div>

      {(error || notice) && <div role={error ? 'alert' : 'status'} className={`mb-5 rounded-xl px-4 py-3 text-sm font-semibold ${error ? 'bg-[#fae9e3] text-[#a53d2a]' : 'bg-accent-soft text-accent'}`}>{error || notice}</div>}

      <section className="section-rule py-6">
        <h2 className="text-lg font-bold text-ink">Profile details</h2>
        <form onSubmit={saveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label><span className="field-label">Name</span><input required value={name} onChange={(event) => setName(event.target.value)} className="field-input" /></label>
          <label><span className="field-label">Phone</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="field-input" /></label>
          <label><span className="field-label">Neighborhood</span><input value={area} onChange={(event) => setArea(event.target.value)} className="field-input" /></label>
          <div className="flex items-end"><button type="submit" disabled={busy} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-action px-5 text-sm font-bold text-white disabled:opacity-60">Save profile <Check size={16} /></button></div>
        </form>
      </section>

      <section className="section-rule py-6">
        <div className="flex items-center gap-2"><MailCheck size={19} className="text-accent" /><h2 className="text-lg font-bold text-ink">Email verification</h2></div>
        <p className="mt-1 text-sm text-muted">{user.emailVerified ? 'Your email is verified.' : `Verify ${user.email} with the code sent to your inbox.`}</p>
        {!user.emailVerified && <form onSubmit={submitOtp} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="6-digit code" aria-label="Email verification code" className="field-input sm:max-w-[220px]" />
          <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-action px-5 text-sm font-bold text-white disabled:opacity-60">Verify email</button>
          <button type="button" disabled={busy} onClick={resendCode} className="min-h-12 rounded-full border border-line px-5 text-sm font-semibold text-ink disabled:opacity-60">Resend code</button>
        </form>}
      </section>

      <section className="section-rule py-6">
        <div className="flex items-center gap-2"><ShieldCheck size={19} className="text-accent" /><h2 className="text-lg font-bold text-ink">Community verification</h2></div>
        <p className="mt-1 text-sm text-muted">{user.communityVerified ? `Verified${user.community_id ? ` with ${user.community_id}` : ''}.` : user.emailVerified ? 'Enter the verification code provided by your community.' : 'Verify your email before community verification.'}</p>
        {user.emailVerified && !user.communityVerified && <form onSubmit={submitCommunityCode} className="mt-4 flex gap-3">
          <input required value={communityCode} onChange={(event) => setCommunityCode(event.target.value)} placeholder="Community code" aria-label="Community verification code" className="field-input max-w-[280px]" />
          <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-action px-5 text-sm font-bold text-white disabled:opacity-60">Verify</button>
        </form>}
      </section>

      <section className="section-rule py-6">
        <h2 className="text-lg font-bold text-ink">Offer help</h2>
        <form onSubmit={submitOffer} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label><span className="field-label">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="field-input"><option>Groceries</option><option>Moving</option><option>Technical</option><option>Pet Care</option><option>Elderly Care</option><option>Tutoring</option><option>Transportation</option><option>Around Home</option><option>Other</option></select></label>
          <label><span className="field-label">Skills, separated by commas</span><input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Driving, plant care" className="field-input" /></label>
          <label className="sm:col-span-2"><span className="field-label">What can you help with?</span><textarea required maxLength={1000} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="field-input resize-y" /></label>
          <div className="sm:col-span-2"><button type="submit" disabled={offerBusy} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-bold text-white disabled:opacity-60"><Plus size={16} />{offerBusy ? 'Publishing…' : 'Publish offer'}</button></div>
        </form>
        <div className="mt-5 divide-y divide-line">
          {offers.map((offer) => <article key={offer.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0"><div className="flex items-center gap-2"><h3 className="font-bold text-ink">{offer.category}</h3><span className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold text-muted">{offer.status}</span></div><p className="mt-1 text-sm text-muted">{offer.description}</p><p className="mt-1 inline-flex items-center gap-1 text-xs text-muted"><MapPin size={13} /> {offer.service_radius} km service radius</p></div>
            <div className="flex gap-2"><button type="button" onClick={() => toggleOffer(offer)} className="min-h-9 rounded-full border border-line px-3 text-xs font-semibold">{offer.status === 'active' ? 'Pause' : 'Reactivate'}</button><button type="button" aria-label={`Delete ${offer.category} offer`} onClick={() => removeOffer(offer.id)} className="grid size-9 place-items-center rounded-full border border-line text-action"><Trash2 size={15} /></button></div>
          </article>)}
          {!offers.length && <p className="py-4 text-sm text-muted">You have not published a help offer yet.</p>}
        </div>
      </section>
    </div>
  )
}