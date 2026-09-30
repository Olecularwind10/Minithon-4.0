import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  HeartHandshake,
  House,
  MapPin,
  Plus,
  Search,
  ShoppingBasket,
  Sparkles,
  Star,
  UserRound,
  WifiOff,
  X,
} from 'lucide-react'
import {
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'

export type HelpRequest = {
  id: string
  title: string
  description: string
  category: string
  when: string
  location: string
  distance: string
  name: string
  avatar: string
  image: string
}

const initialRequests: HelpRequest[] = [
  {
    id: '1',
    title: 'Could someone water my plants?',
    description: 'I’m away for a few days and my balcony plants could use a little drink.',
    category: 'Around home',
    when: 'Today, before 6 pm',
    location: 'Maple Street',
    distance: '0.2 mi',
    name: 'Nina Flores',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: '2',
    title: 'A lift to the farmers market',
    description: 'My bike is in the shop. Happy to chip in for gas and keep you company.',
    category: 'Rides',
    when: 'Saturday, 9:30 am',
    location: 'Cedar Grove',
    distance: '0.4 mi',
    name: 'Jonah Reed',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: '3',
    title: 'Can anyone grab a few groceries?',
    description: 'Just a couple of things from the corner shop while I recover from a cold.',
    category: 'Groceries',
    when: 'Today, whenever works',
    location: 'Willow Lane',
    distance: '0.6 mi',
    name: 'Amara Okafor',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: '4',
    title: 'A hand moving a bookcase',
    description: 'The new place is just upstairs. One strong pair of hands would help a lot.',
    category: 'Around home',
    when: 'Sunday, 11 am',
    location: 'Pine Court',
    distance: '0.8 mi',
    name: 'Eli Bennett',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85',
  },
]

const categories = ['All', 'Groceries', 'Rides', 'Around home', 'Pet care']
const RequestMap = lazy(() => import('./components/NeighborhoodRequestMap'))

function useOfflineStatus() {
  const [offline, setOffline] = useState(
    () => typeof navigator !== 'undefined' && !navigator.onLine,
  )

  useEffect(() => {
    const updateStatus = () => setOffline(!navigator.onLine)
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  return offline
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-ink no-underline">
      <img src="/app-icon.svg" alt="" className="size-9 rounded-xl" />
      <span className="text-[16px] font-bold tracking-[-0.3px]">Neighborhood Help</span>
    </Link>
  )
}

function Header({ offline }: { offline: boolean }) {
  return (
    <header className="app-header">
      <div className="header-inner flex items-center justify-between">
        <Brand />
        <nav aria-label="Main navigation" className="desktop-nav hidden items-center gap-2 sm:flex">
          <NavLink end to="/" className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-semibold ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/discover" className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-semibold ${isActive ? 'active' : ''}`}>
            Discover
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-semibold ${isActive ? 'active' : ''}`}>
            Profile
          </NavLink>
          <Link to="/create" className="ml-2 inline-flex items-center gap-2 rounded-full bg-action px-4 py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]">
            <Plus size={16} /> Ask for help
          </Link>
        </nav>
        {offline && (
          <span role="status" className="inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-3 py-1.5 text-xs font-semibold text-ink">
            <WifiOff size={14} /> Offline
          </span>
        )}
      </div>
    </header>
  )
}

function BottomNavigation({ onOpenActions }: { onOpenActions: () => void }) {
  const itemClass = ({ isActive }: { isActive: boolean }) => `mobile-nav-link ${isActive ? 'active' : ''}`

  return (
    <nav aria-label="Bottom navigation" className="mobile-nav flex items-center justify-around sm:hidden">
      <NavLink end to="/" className={itemClass}>
        <House size={21} strokeWidth={1.8} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/discover" className={itemClass}>
        <Search size={21} strokeWidth={1.8} />
        <span>Discover</span>
      </NavLink>
      <button
        type="button"
        onClick={onOpenActions}
        aria-label="Create or offer help"
        className="-mt-5 grid size-12 place-items-center rounded-full bg-action text-white shadow-[0_5px_16px_rgba(189,69,47,0.24)] transition-transform active:scale-[0.96]"
      >
        <Plus size={23} />
      </button>
      <NavLink to="/profile" className={itemClass}>
        <UserRound size={21} strokeWidth={1.8} />
        <span>Profile</span>
      </NavLink>
    </nav>
  )
}

function QuickActions({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="quick-actions-title" className="action-sheet p-5">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 id="quick-actions-title" className="text-lg font-bold text-ink">How can we help?</h2>
            <p className="mt-1 text-sm text-muted">A little support goes both ways.</p>
          </div>
          <button type="button" aria-label="Close menu" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-surface-soft text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-3">
          <Link onClick={onClose} to="/create" className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-ink no-underline transition-colors hover:bg-surface-soft">
            <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent"><HeartHandshake size={22} /></span>
            <span className="flex-1"><strong className="block text-sm">Ask for help</strong><span className="text-xs text-muted">Post something you need a hand with</span></span>
            <ArrowRight size={18} className="text-muted" />
          </Link>
          <Link onClick={onClose} to="/discover" className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-ink no-underline transition-colors hover:bg-surface-soft">
            <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent"><Sparkles size={21} /></span>
            <span className="flex-1"><strong className="block text-sm">Offer help</strong><span className="text-xs text-muted">See what a neighbor needs today</span></span>
            <ArrowRight size={18} className="text-muted" />
          </Link>
        </div>
      </section>
    </div>
  )
}

function RequestCard({
  request,
  offered,
  onOffer,
}: {
  request: HelpRequest
  offered: boolean
  onOffer: (id: string) => void
}) {
  return (
    <article className="request-card rounded-[22px] border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-3.5">
        <img src={request.avatar} alt="" className="size-11 shrink-0 rounded-full object-cover" loading="lazy" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-bold text-ink">{request.name}</span>
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">{request.category}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-bold leading-snug tracking-[-0.2px] text-ink">{request.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{request.description}</p>
        </div>
        {request.image && <img src={request.image} alt="" className="size-[76px] shrink-0 rounded-[16px] object-cover sm:size-[92px]" loading="lazy" />}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3.5 text-xs font-medium text-muted">
        <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{request.when}</span>
        <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{request.distance} away</span>
        <span>{request.location}</span>
      </div>
      <button
        type="button"
        onClick={() => onOffer(request.id)}
        disabled={offered}
        className={`mt-4 inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors active:scale-[0.98] ${offered ? 'bg-accent-soft text-accent' : 'bg-action text-white hover:opacity-90'}`}
      >
        {offered ? <Check size={16} /> : <HeartHandshake size={16} />}
        {offered ? 'Offer sent' : 'I can help'}
      </button>
    </article>
  )
}

function HomePage({
  requests,
  offers,
  onOffer,
  notice,
  onDismissNotice,
  onOfferHelp,
}: {
  requests: HelpRequest[]
  offers: Record<string, boolean>
  onOffer: (id: string) => void
  notice: string
  onDismissNotice: () => void
  onOfferHelp: () => void
}) {
  return (
    <div className="page-enter">
      {notice && (
        <div role="status" className="mb-5 flex items-center justify-between rounded-2xl bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">
          <span className="inline-flex items-center gap-2"><Check size={17} />{notice}</span>
          <button type="button" aria-label="Dismiss message" onClick={onDismissNotice}><X size={17} /></button>
        </div>
      )}
      <section className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent"><MapPin size={15} /> Cedar Grove</p>
          <h1 className="mt-1 text-[30px] font-bold leading-tight tracking-[-0.8px] text-ink sm:text-[36px]">Morning, Maya</h1>
          <p className="mt-1.5 text-sm text-muted sm:text-base">A few good neighbors are close by.</p>
        </div>
        <Link to="/profile" aria-label="View your profile" className="hidden size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-surface sm:block">
          <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80" alt="" className="size-full object-cover" />
        </Link>
      </section>

      <section className="home-feature mt-6 grid overflow-hidden rounded-[26px] sm:grid-cols-[1.05fr_0.95fr]">
        <div className="hero-copy order-2 flex flex-col items-start justify-center p-6 text-white sm:order-1 sm:p-8 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/65">Good things happen nearby</p>
          <h2 className="mt-3 max-w-[390px] text-[29px] font-bold leading-[1.08] tracking-[-0.7px] text-white sm:text-[34px]">Good neighbors are closer than you think.</h2>
          <p className="mt-2 max-w-[330px] text-sm leading-relaxed text-white/75">Ask for a hand, or lend one to someone on your block.</p>
          <div className="mt-6 grid w-full grid-cols-2 gap-2.5 sm:max-w-[340px]">
            <Link to="/create" className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-action px-3 text-sm font-bold text-white no-underline transition-transform active:scale-[0.98]">
              <HeartHandshake size={16} /> Ask for help
            </Link>
            <button type="button" onClick={onOfferHelp} className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/25 bg-white/5 px-3 text-sm font-bold text-white transition-transform active:scale-[0.98]">
              <Sparkles size={16} /> Offer help
            </button>
          </div>
        </div>
        <div className="hero-photo order-1 relative min-h-[190px] overflow-hidden sm:order-2 sm:min-h-[330px]">
          <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=85" alt="Neighbors sharing time together outdoors" className="absolute inset-0 size-full object-cover" />
          <div className="photo-fade absolute inset-0" />
        </div>
      </section>

      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-bold tracking-[-0.45px] text-ink">Open requests</h2>
            <p className="mt-1 text-sm text-muted">A few neighbors could use a hand.</p>
          </div>
          <Link to="/discover" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-accent no-underline">See all <ArrowRight size={16} /></Link>
        </div>
        <div className="grid gap-3.5">
          {requests.slice(0, 2).map((request) => (
            <RequestCard key={request.id} request={request} offered={Boolean(offers[request.id])} onOffer={onOffer} />
          ))}
        </div>
      </section>
    </div>
  )
}

function DiscoverPage({
  requests,
  offers,
  onOffer,
}: {
  requests: HelpRequest[]
  offers: Record<string, boolean>
  onOffer: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const visibleRequests = requests.filter((request) => {
    const matchesCategory = category === 'All' || request.category === category
    const searchable = `${request.title} ${request.description} ${request.location} ${request.name}`.toLowerCase()
    return matchesCategory && searchable.includes(query.toLowerCase().trim())
  })

  return (
    <div className="page-enter">
      <div className="mb-6">
        <p className="text-sm font-semibold text-accent">Good neighbors, right nearby</p>
        <h1 className="mt-1 text-[30px] font-bold leading-tight tracking-[-0.8px] text-ink sm:text-[36px]">Discover help</h1>
        <p className="mt-2 text-sm text-muted sm:text-base">Find a small way to make someone’s day.</p>
      </div>
      <label className="relative block">
        <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <span className="sr-only">Search requests</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search nearby requests" className="field-input pl-11 pr-4" />
      </label>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by category">
        {categories.map((item) => (
          <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`min-h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${category === item ? 'bg-action text-white' : 'border border-line bg-surface text-muted hover:text-ink'}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1fr_1.08fr]">
        <div className="lg:sticky lg:top-5">
          <Suspense fallback={<div role="status" className="map-loading">Loading neighborhood map</div>}>
            <RequestMap requests={visibleRequests} />
          </Suspense>
        </div>
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Requests near you</h2>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted"><MapPin size={14} /> Cedar Grove</span>
          </div>
          {visibleRequests.length > 0 ? (
            <div className="grid gap-3.5">
              {visibleRequests.map((request) => (
                <RequestCard key={request.id} request={request} offered={Boolean(offers[request.id])} onOffer={onOffer} />
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-line bg-surface px-6 py-12 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent-soft text-accent"><Search size={21} /></span>
              <h3 className="mt-4 font-bold text-ink">No requests found</h3>
              <p className="mt-1 text-sm text-muted">Try a different search or category.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function CreateRequestPage({ onCreate }: { onCreate: (request: HelpRequest) => void }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Around home')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('Cedar Grove')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const newRequest: HelpRequest = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      category,
      when: [date, time].filter(Boolean).join(', '),
      location: location.trim(),
      distance: 'nearby',
      name: 'Maya Patel',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
      image: '',
    }
    onCreate(newRequest)
    navigate('/')
  }

  return (
    <div className="page-enter mx-auto max-w-[680px]">
      <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted no-underline"><ArrowLeft size={17} /> Back home</Link>
      <div className="mb-6">
        <p className="text-sm font-semibold text-accent">Ask your neighbors</p>
        <h1 className="mt-1 text-[30px] font-bold leading-tight tracking-[-0.8px] text-ink sm:text-[36px]">What do you need a hand with?</h1>
        <p className="mt-2 text-sm text-muted sm:text-base">Share a few details so someone nearby can lend a hand.</p>
      </div>
      <form onSubmit={handleSubmit} className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_12px_36px_rgba(39,41,34,0.05)] sm:p-7">
        <div className="grid gap-5">
          <label>
            <span className="field-label">What do you need?</span>
            <input required maxLength={72} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Help carrying a table upstairs" className="field-input" />
          </label>
          <label>
            <span className="field-label">A little more detail</span>
            <textarea required maxLength={360} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Share anything a neighbor should know" className="field-input min-h-[112px] resize-y" />
          </label>
          <label>
            <span className="field-label">Category</span>
            <span className="relative block">
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="field-input appearance-none pr-10">
                {categories.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}
              </select>
              <ChevronDown size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
            </span>
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label>
              <span className="field-label">Date</span>
              <span className="relative block">
                <CalendarDays size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
                <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="field-input pr-11" />
              </span>
            </label>
            <label>
              <span className="field-label">Time</span>
              <span className="relative block">
                <Clock3 size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
                <input required type="time" value={time} onChange={(event) => setTime(event.target.value)} className="field-input pr-11" />
              </span>
            </label>
          </div>
          <label>
            <span className="field-label">Nearby location</span>
            <span className="relative block">
              <MapPin size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input required maxLength={60} value={location} onChange={(event) => setLocation(event.target.value)} className="field-input pl-11" />
            </span>
          </label>
        </div>
        <button type="submit" className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-action px-5 text-sm font-bold text-white transition-transform active:scale-[0.99]">
          Post request <ArrowRight size={17} />
        </button>
      </form>
    </div>
  )
}

function ProfilePage() {
  return (
    <div className="page-enter mx-auto max-w-[680px]">
      <div className="mb-6">
        <p className="text-sm font-semibold text-accent">Your neighborhood profile</p>
        <h1 className="mt-1 text-[30px] font-bold leading-tight tracking-[-0.8px] text-ink sm:text-[36px]">A little about you</h1>
      </div>
      <section className="rounded-[26px] bg-[#292d27] p-5 text-white shadow-[0_16px_36px_rgba(39,41,34,0.12)] sm:p-7">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&h=240&q=85" alt="Maya Patel" className="size-24 rounded-full object-cover ring-4 ring-white/15" />
          <div>
            <h2 className="text-[23px] font-bold text-white">Maya Patel</h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/65"><MapPin size={15} /> Cedar Grove neighbor</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75">Happy to lend a hand with errands, plants, and getting things from A to B.</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-5 text-center">
          <div><p className="inline-flex items-center gap-1 text-xl font-bold text-white"><Star size={17} className="fill-current text-[#f09a7f]" /> 4.9</p><p className="mt-1 text-xs text-white/60">Neighbor rating</p></div>
          <div><p className="text-xl font-bold text-white">12</p><p className="mt-1 text-xs text-white/60">Helps given</p></div>
          <div><p className="text-xl font-bold text-white">8</p><p className="mt-1 text-xs text-white/60">Completed</p></div>
        </div>
      </section>
      <section className="section-rule mt-7 pt-6">
        <div className="flex items-center gap-2"><HeartHandshake size={19} className="text-accent" /><h2 className="text-lg font-bold text-ink">Skills I can share</h2></div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Grocery runs', 'Plant care', 'Driving', 'Dog walking'].map((skill) => <span key={skill} className="rounded-full bg-accent-soft px-3.5 py-2 text-sm font-semibold text-accent">{skill}</span>)}
        </div>
      </section>
      <section className="section-rule mt-7 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-lg font-bold text-ink">Completed helps</h2><p className="mt-1 text-sm text-muted">Little things that added up.</p></div>
          <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent"><Check size={19} /></span>
        </div>
        <div className="mt-3 grid gap-x-8 sm:grid-cols-2">
          <div className="border-b border-line py-4"><span className="inline-flex items-center gap-2 text-sm font-bold text-ink"><ShoppingBasket size={17} className="text-accent" /> Grocery pickup</span><p className="mt-1 pl-6 text-xs text-muted">Helped Nina on Monday</p></div>
          <div className="border-b border-line py-4"><span className="inline-flex items-center gap-2 text-sm font-bold text-ink"><Bike size={17} className="text-accent" /> Ride to the clinic</span><p className="mt-1 pl-6 text-xs text-muted">Helped Marcus last week</p></div>
        </div>
      </section>
    </div>
  )
}

function App() {
  const offline = useOfflineStatus()
  const [requests, setRequests] = useState(initialRequests)
  const [offers, setOffers] = useState<Record<string, boolean>>({})
  const [showActions, setShowActions] = useState(false)
  const [notice, setNotice] = useState('')
  const navigate = useNavigate()

  function offerHelp(id: string) {
    setOffers((current) => ({ ...current, [id]: true }))
  }

  function createRequest(request: HelpRequest) {
    setRequests((current) => [request, ...current])
    setNotice('Your request is up. A neighbor may be able to help.')
  }

  function goOfferHelp() {
    navigate('/discover')
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header offline={offline} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage requests={requests} offers={offers} onOffer={offerHelp} notice={notice} onDismissNotice={() => setNotice('')} onOfferHelp={goOfferHelp} />} />
          <Route path="/discover" element={<DiscoverPage requests={requests} offers={offers} onOffer={offerHelp} />} />
          <Route path="/create" element={<CreateRequestPage onCreate={createRequest} />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<HomePage requests={requests} offers={offers} onOffer={offerHelp} notice={notice} onDismissNotice={() => setNotice('')} onOfferHelp={goOfferHelp} />} />
        </Routes>
      </main>
      <BottomNavigation onOpenActions={() => setShowActions(true)} />
      {showActions && <QuickActions onClose={() => setShowActions(false)} />}
    </div>
  )
}

export default App