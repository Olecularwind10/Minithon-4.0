import { useEffect, useState, type FormEvent } from 'react'
import { Activity, BadgeCheck, Flag, Plus, Search, Shield, Trash2, X } from 'lucide-react'
import type { AuthUser } from '../lib/api'
import type { LocationCoordinates } from '../types/location'
import {
  blockUser,
  createActivity,
  createCommunityReport,
  createDirectoryService,
  getActivityParticipants,
  fetchAdminStats,
  fetchCommunityHistory,
  fetchCommunityReviews,
  fetchCommunityTrust,
  fetchModerationLog,
  getActivity,
  getDirectoryService,
  joinActivity,
  leaveActivity,
  listActivities,
  listActivityCategories,
  listAdminReports,
  listAdminUsers,
  listBlockedUsers,
  listDirectoryCategories,
  listMyReports,
  removeActivityParticipant,
  removeAdminContent,
  reportActivity,
  reportDirectoryService,
  reviewAdminReport,
  searchCommunityPeople,
  searchDirectory,
  setActivityStatus,
  setAdminUserStatus,
  setAdminVerification,
  unblockUser,
  updateDirectoryService,
  type ActivityCategory,
  type ActivityParticipant,
  type CommunityActivity,
  type CommunityReport,
  type CommunityTrust,
  type CommunityUser,
  type DirectoryService,
  type ServiceCategory,
} from '../lib/communityApi'

const serviceCategoryLabels: Record<ServiceCategory, string> = {
  plumber: 'Plumber', electrician: 'Electrician', carpenter: 'Carpenter', tutor: 'Tutor', clinic: 'Clinic', pharmacy: 'Pharmacy', community_centre: 'Community Centre', emergency_contact: 'Emergency Contact', grocery: 'Grocery', repair: 'Repair', other: 'Other',
}
const activityCategoryLabels: Record<ActivityCategory, string> = {
  clean_up: 'Clean-up drive', volunteering: 'Volunteering', event: 'Local event', workshop: 'Workshop', sports: 'Sports', festival: 'Festival', safety_drive: 'Safety drive', other: 'Other',
}
const reasons = ['spam', 'harassment', 'unsafe', 'fraud', 'inappropriate', 'misleading', 'other']
const controlClass = 'min-h-10 rounded-full border border-line px-4 text-sm font-semibold text-ink disabled:opacity-50'
const primaryClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-action px-4 text-sm font-bold text-white disabled:opacity-50'

function ErrorNotice({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null
  return <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-[#fae9e3] px-4 py-3 text-sm font-semibold text-[#a53d2a]"><span>{message}</span><button type="button" aria-label="Dismiss error" onClick={onClose}><X size={17} /></button></div>
}

function ReportForm({ targetType, targetId, onSubmit, onCancel }: { targetType: CommunityReport['targetType']; targetId: string; onSubmit: (reason: string, details: string) => Promise<void>; onCancel: () => void }) {
  const [reason, setReason] = useState('unsafe')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try { await onSubmit(reason, details); onCancel() } finally { setBusy(false) }
  }
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-line bg-surface p-4">
    <div className="flex items-center justify-between"><h3 className="font-bold text-ink">Report {targetType}: {targetId}</h3><button type="button" onClick={onCancel} aria-label="Close report form"><X size={17} /></button></div>
    <select value={reason} onChange={(event) => setReason(event.target.value)} className="field-input">{reasons.map((item) => <option key={item} value={item}>{item}</option>)}</select>
    <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={3} maxLength={1000} placeholder="Add details" className="field-input resize-y" />
    <button disabled={busy} className={primaryClass}><Flag size={15} />{busy ? 'Submitting…' : 'Submit report'}</button>
  </form>
}

export default function CommunityHubPage({ user, location, reportRequestId, onRequestReportHandled }: {
  user: AuthUser
  location: LocationCoordinates
  reportRequestId: string
  onRequestReportHandled: () => void
}) {
  const [section, setSection] = useState<'directory' | 'activities' | 'trust' | 'safety' | 'admin'>('directory')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reportTarget, setReportTarget] = useState<{ type: CommunityReport['targetType']; id: string } | null>(null)
  const [services, setServices] = useState<DirectoryService[]>([])
  const [serviceCategories, setServiceCategories] = useState<Array<{ category: ServiceCategory; count: number }>>([])
  const [directoryQuery, setDirectoryQuery] = useState('')
  const [directoryCategory, setDirectoryCategory] = useState('')
  const [editingService, setEditingService] = useState<DirectoryService | null>(null)
  const [serviceFormOpen, setServiceFormOpen] = useState(false)
  const [serviceForm, setServiceForm] = useState({ name: '', category: 'plumber' as ServiceCategory, description: '', phone: '', openingHours: '', area: user.area || 'Parel' })
  const [activities, setActivities] = useState<CommunityActivity[]>([])
  const [activityCategories, setActivityCategories] = useState<ActivityCategory[]>([])
  const [activityQuery, setActivityQuery] = useState('')
  const [activityFilter, setActivityFilter] = useState('open')
  const [activityFormOpen, setActivityFormOpen] = useState(false)
  const [activityForm, setActivityForm] = useState({ title: '', description: '', category: 'clean_up' as ActivityCategory, area: user.area || 'Parel', date: '', time: '', maxParticipants: '20' })
  const [selectedActivity, setSelectedActivity] = useState<CommunityActivity | null>(null)
  const [participants, setParticipants] = useState<ActivityParticipant[]>([])
  const [trust, setTrust] = useState<CommunityTrust | null>(null)
  const [reviews, setReviews] = useState<{ items: Array<{ id: string; rating: number; comment: string | null; createdAt: string; reviewer: string | null }>; distribution: Record<number, number> } | null>(null)
  const [history, setHistory] = useState<{ given: Array<{ id: string; title: string; category: string; completedAt: string | null }>; received: Array<{ id: string; title: string; category: string; completedAt: string | null }> } | null>(null)
  const [blockedUsers, setBlockedUsers] = useState<Array<{ userId: string; name: string | null; blockedAt: string }>>([])
  const [myReports, setMyReports] = useState<CommunityReport[]>([])
  const [peopleQuery, setPeopleQuery] = useState('')
  const [people, setPeople] = useState<Array<{ id: string; name: string; area: string | null }>>([])
  const [selectedPerson, setSelectedPerson] = useState<{ id: string; name: string; area: string | null } | null>(null)
  const [reportType, setReportType] = useState<CommunityReport['targetType']>('request')
  const [reportId, setReportId] = useState('')
  const [adminStats, setAdminStats] = useState<{ openReports: number; reviewingReports: number; suspendedUsers: number; totalUsers: number } | null>(null)
  const [adminReports, setAdminReports] = useState<CommunityReport[]>([])
  const [adminUsers, setAdminUsers] = useState<CommunityUser[]>([])
  const [moderationLog, setModerationLog] = useState<Array<{ id: string; adminId: string; action: string; targetType: string | null; targetId: string | null; note: string | null; createdAt: string }>>([])
  const [adminQuery, setAdminQuery] = useState('')

  useEffect(() => {
    if (!reportRequestId) return
    setSection('safety')
    setReportTarget({ type: 'request', id: reportRequestId })
    onRequestReportHandled()
  }, [reportRequestId, onRequestReportHandled])

  function fail(problem: unknown) { setError(problem instanceof Error ? problem.message : 'Community request failed') }
  function succeed(message: string) { setError(''); setNotice(message) }

  useEffect(() => {
    if (section !== 'directory') return
    let active = true
    Promise.all([
      searchDirectory({ q: directoryQuery, category: directoryCategory || undefined, lat: location.latitude, lng: location.longitude }),
      listDirectoryCategories(),
    ]).then(([listing, categoryList]) => {
      if (active) { setServices(listing.items); setServiceCategories(categoryList) }
    }).catch(fail)
    return () => { active = false }
  }, [section, directoryQuery, directoryCategory, location.latitude, location.longitude])

  useEffect(() => {
    if (section !== 'activities') return
    let active = true
    Promise.all([
      listActivities({ q: activityQuery, status: activityFilter, lat: location.latitude, lng: location.longitude, radius: 30 }),
      listActivityCategories(),
    ]).then(([listing, categoryList]) => {
      if (active) { setActivities(listing.items); setActivityCategories(categoryList) }
    }).catch(fail)
    return () => { active = false }
  }, [section, activityQuery, activityFilter, location.latitude, location.longitude])

  useEffect(() => {
    if (section !== 'trust') return
    let active = true
    Promise.all([fetchCommunityTrust(), fetchCommunityReviews(user.id), fetchCommunityHistory(user.id)])
      .then(([score, userReviews, userHistory]) => {
        if (active) { setTrust(score); setReviews(userReviews); setHistory(userHistory) }
      }).catch(fail)
    return () => { active = false }
  }, [section, user.id])

  useEffect(() => {
    if (section !== 'safety') return
    let active = true
    Promise.all([listBlockedUsers(), listMyReports()]).then(([blocks, reports]) => {
      if (active) { setBlockedUsers(blocks.items); setMyReports(reports) }
    }).catch(fail)
    return () => { active = false }
  }, [section])

  useEffect(() => {
    if (!user.role || user.role !== 'admin' || section !== 'admin') return
    let active = true
    Promise.all([fetchAdminStats(), listAdminReports(), listAdminUsers({ q: adminQuery }), fetchModerationLog()])
      .then(([stats, reports, users, log]) => {
        if (active) { setAdminStats(stats); setAdminReports(reports.items); setAdminUsers(users.items); setModerationLog(log) }
      }).catch(fail)
    return () => { active = false }
  }, [section, user.role, adminQuery])

  useEffect(() => {
    if (peopleQuery.trim().length < 2) { setPeople([]); return }
    let active = true
    const timer = window.setTimeout(() => searchCommunityPeople(peopleQuery).then((result) => {
      if (active) setPeople(result.items)
    }).catch(fail), 250)
    return () => { active = false; window.clearTimeout(timer) }
  }, [peopleQuery])

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      if (editingService) await updateDirectoryService(editingService.id, { ...serviceForm, baseUpdatedAt: editingService.updatedAt })
      else await createDirectoryService({ ...serviceForm, latitude: location.latitude, longitude: location.longitude })
      setServiceFormOpen(false); setEditingService(null)
      setServiceForm({ name: '', category: 'plumber', description: '', phone: '', openingHours: '', area: user.area || 'Parel' })
      succeed(editingService ? 'Service updated.' : 'Service added to the directory.')
      const listing = await searchDirectory({ q: directoryQuery, category: directoryCategory || undefined, lat: location.latitude, lng: location.longitude })
      setServices(listing.items)
    } catch (problem) { fail(problem) }
  }

  async function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await createActivity({ ...activityForm, maxParticipants: activityForm.maxParticipants ? Number(activityForm.maxParticipants) : null, latitude: location.latitude, longitude: location.longitude })
      setActivityFormOpen(false)
      setActivityForm({ title: '', description: '', category: 'clean_up', area: user.area || 'Parel', date: '', time: '', maxParticipants: '20' })
      succeed('Activity published.')
      const result = await listActivities({ status: activityFilter, lat: location.latitude, lng: location.longitude, radius: 30 })
      setActivities(result.items)
    } catch (problem) { fail(problem) }
  }

  async function openActivity(activity: CommunityActivity) {
    try {
      const detail = await getActivity(activity.id)
      setSelectedActivity(detail)
      if (detail.isOrganizer) {
        const result = await getActivityParticipants(activity.id)
        setParticipants(result.items)
      } else setParticipants(detail.participants ?? [])
    } catch (problem) { fail(problem) }
  }

  async function activityMembership(action: 'join' | 'leave', activity: CommunityActivity) {
    try {
      const result = action === 'join' ? await joinActivity(activity.id) : await leaveActivity(activity.id)
      setActivities((current) => current.map((item) => item.id === activity.id ? result.activity : item))
      if (selectedActivity?.id === activity.id) await openActivity(result.activity)
      succeed(action === 'join' ? 'You joined the activity.' : 'You left the activity.')
    } catch (problem) { fail(problem) }
  }

  async function activityStatus(activity: CommunityActivity, status: string) {
    try {
      const updated = await setActivityStatus(activity.id, status)
      setActivities((current) => current.map((item) => item.id === activity.id ? updated : item))
      setSelectedActivity(updated)
      succeed(`Activity marked ${status}.`)
    } catch (problem) { fail(problem) }
  }

  async function submitReport(reason: string, details: string) {
    if (!reportTarget) return
    if (reportTarget.type === 'service') await reportDirectoryService(reportTarget.id, reason, details)
    else if (reportTarget.type === 'activity') await reportActivity(reportTarget.id, reason, details)
    else await createCommunityReport({ targetType: reportTarget.type, targetId: reportTarget.id, reason, details })
    succeed('Report submitted to the community moderators.')
  }

  async function submitSafetyReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await createCommunityReport({ targetType: reportType, targetId: reportId.trim(), reason: 'unsafe', details: '' })
      setReportId(''); succeed('Report submitted to the community moderators.')
      setMyReports(await listMyReports())
    } catch (problem) { fail(problem) }
  }

  async function submitBlock(person = selectedPerson) {
    if (!person) return
    try {
      await blockUser(person.id)
      setBlockedUsers((current) => [{ userId: person.id, name: person.name, blockedAt: new Date().toISOString() }, ...current])
      setPeople((current) => current.filter((item) => item.id !== person.id))
      setSelectedPerson(null); succeed(`${person.name} was blocked.`)
    } catch (problem) { fail(problem) }
  }

  async function unblock(id: string) {
    try {
      await unblockUser(id)
      setBlockedUsers((current) => current.filter((item) => item.userId !== id))
      succeed('User unblocked.')
    } catch (problem) { fail(problem) }
  }

  async function updateReport(report: CommunityReport, status: string) {
    try {
      await reviewAdminReport(report.id, status, status === 'actioned' ? 'Reviewed by community moderator.' : '')
      setAdminReports((current) => current.map((item) => item.id === report.id ? { ...item, status: status as CommunityReport['status'] } : item))
      setAdminStats(await fetchAdminStats())
      setModerationLog(await fetchModerationLog())
      succeed(`Report marked ${status}.`)
    } catch (problem) { fail(problem) }
  }

  async function moderateRemove(report: CommunityReport) {
    try {
      await removeAdminContent(report.targetType, report.targetId, 'Removed after report review.', report.id)
      setAdminReports((current) => current.map((item) => item.id === report.id ? { ...item, status: 'actioned' } : item))
      setAdminStats(await fetchAdminStats())
      setModerationLog(await fetchModerationLog())
      succeed('Reported content removed.')
    } catch (problem) { fail(problem) }
  }

  async function toggleSuspension(person: CommunityUser) {
    try {
      const status = person.status === 'suspended' ? 'active' : 'suspended'
      await setAdminUserStatus(person.id, status, `Changed by ${user.name}`)
      setAdminUsers((current) => current.map((item) => item.id === person.id ? { ...item, status } : item))
      setAdminStats(await fetchAdminStats())
      setModerationLog(await fetchModerationLog())
      succeed(`${person.name} is now ${status}.`)
    } catch (problem) { fail(problem) }
  }

  async function toggleAdminVerification(person: CommunityUser, field: 'email' | 'phone') {
    try {
      const updated = await setAdminVerification(person.id, field === 'email' ? !person.emailVerified : person.emailVerified, field === 'phone' ? !person.phoneVerified : person.phoneVerified)
      setAdminUsers((current) => current.map((item) => item.id === person.id ? { ...item, emailVerified: updated.emailVerified, phoneVerified: updated.phoneVerified } : item))
      succeed('Verification flags updated.')
    } catch (problem) { fail(problem) }
  }

  const tabs = [
    { id: 'directory' as const, label: 'Directory', icon: Search },
    { id: 'activities' as const, label: 'Activities', icon: Activity },
    { id: 'trust' as const, label: 'Trust', icon: BadgeCheck },
    { id: 'safety' as const, label: 'Safety', icon: Shield },
    ...(user.role === 'admin' ? [{ id: 'admin' as const, label: 'Moderation', icon: Flag }] : []),
  ]

  return (
    <div className="page-enter mx-auto max-w-[1120px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-accent">Your neighborhood</p><h1 className="mt-1 text-[30px] font-bold leading-tight text-ink">Community hub</h1></div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Community sections">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={section === id} onClick={() => { setSection(id); setError(''); setNotice('') }} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${section === id ? 'bg-action text-white' : 'border border-line bg-surface text-muted'}`}><Icon size={15} />{label}</button>)}
        </div>
      </div>
      {notice && <p role="status" className="mb-4 rounded-xl bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">{notice}</p>}
      <ErrorNotice message={error} onClose={() => setError('')} />
      {section === 'directory' && <section>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input value={directoryQuery} onChange={(event) => setDirectoryQuery(event.target.value)} placeholder="Search services" aria-label="Search services" className="field-input pl-10" /></label>
          <select value={directoryCategory} onChange={(event) => setDirectoryCategory(event.target.value)} aria-label="Filter service category" className="field-input w-auto min-w-[190px]"><option value="">All categories</option>{serviceCategories.map(({ category, count }) => <option key={category} value={category}>{serviceCategoryLabels[category]} ({count})</option>)}</select>
          <button type="button" onClick={() => { setEditingService(null); setServiceFormOpen((open) => !open) }} className={primaryClass}><Plus size={16} />Add service</button>
        </div>
        {serviceFormOpen && <form onSubmit={saveService} className="mb-5 grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
          <label><span className="field-label">Service name</span><input required value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} className="field-input" /></label>
          <label><span className="field-label">Category</span><select value={serviceForm.category} onChange={(event) => setServiceForm({ ...serviceForm, category: event.target.value as ServiceCategory })} className="field-input">{Object.entries(serviceCategoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label><span className="field-label">Area</span><input required value={serviceForm.area} onChange={(event) => setServiceForm({ ...serviceForm, area: event.target.value })} className="field-input" /></label>
          <label><span className="field-label">Phone</span><input value={serviceForm.phone} onChange={(event) => setServiceForm({ ...serviceForm, phone: event.target.value })} className="field-input" /></label>
          <label><span className="field-label">Opening hours</span><input value={serviceForm.openingHours} onChange={(event) => setServiceForm({ ...serviceForm, openingHours: event.target.value })} className="field-input" /></label>
          <label><span className="field-label">Description</span><input value={serviceForm.description} onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })} className="field-input" /></label>
          <div className="flex gap-2 sm:col-span-2"><button className={primaryClass}>{editingService ? 'Save service' : 'Publish service'}</button><button type="button" onClick={() => { setServiceFormOpen(false); setEditingService(null) }} className={controlClass}>Cancel</button></div>
        </form>}
        <div className="divide-y divide-line border-y border-line">
          {services.map((service) => <article key={service.id} className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <button type="button" onClick={() => getDirectoryService(service.id).then((detail) => setServices((current) => current.map((item) => item.id === detail.id ? detail : item))).catch(fail)} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-ink">{service.name}</h2><span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">{serviceCategoryLabels[service.category]}</span></div><p className="mt-1 text-sm text-muted">{service.description || 'No description provided.'}</p><p className="mt-2 text-xs text-muted">{service.area}{service.distanceKm === null ? '' : ` · ${service.distanceKm.toFixed(1)} km`}{service.openingHours ? ` · ${service.openingHours}` : ''}</p></button>
              <div className="flex gap-2"><button type="button" onClick={() => setReportTarget({ type: 'service', id: service.id })} className={controlClass}>Report</button>{service.canEdit && <button type="button" onClick={() => { setEditingService(service); setServiceForm({ name: service.name, category: service.category, description: service.description || '', phone: service.phone || '', openingHours: service.openingHours || '', area: service.area }); setServiceFormOpen(true) }} className={controlClass}>Edit</button>}</div>
            </div>
            {service.phone && <a href={`tel:${service.phone}`} className="mt-3 inline-block text-sm font-semibold text-accent">Call {service.phone}</a>}
          </article>)}
          {!services.length && <p className="py-10 text-center text-sm text-muted">No services match this search.</p>}
        </div>
      </section>}
      {section === 'activities' && <section>
        <div className="mb-4 flex flex-wrap items-center gap-3"><label className="relative min-w-[210px] flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input value={activityQuery} onChange={(event) => setActivityQuery(event.target.value)} placeholder="Search activities" aria-label="Search activities" className="field-input pl-10" /></label><select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)} className="field-input w-auto"><option value="open">Upcoming and ongoing</option><option value="all">All statuses</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><button type="button" onClick={() => setActivityFormOpen((open) => !open)} className={primaryClass}><Plus size={16} />Create activity</button></div>
        {activityFormOpen && <form onSubmit={saveActivity} className="mb-5 grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
          <label><span className="field-label">Title</span><input required minLength={3} value={activityForm.title} onChange={(event) => setActivityForm({ ...activityForm, title: event.target.value })} className="field-input" /></label>
          <label><span className="field-label">Category</span><select value={activityForm.category} onChange={(event) => setActivityForm({ ...activityForm, category: event.target.value as ActivityCategory })} className="field-input">{activityCategories.map((category) => <option key={category} value={category}>{activityCategoryLabels[category]}</option>)}</select></label>
          <label><span className="field-label">Area</span><input required value={activityForm.area} onChange={(event) => setActivityForm({ ...activityForm, area: event.target.value })} className="field-input" /></label>
          <label><span className="field-label">Max participants</span><input type="number" min="2" max="1000" value={activityForm.maxParticipants} onChange={(event) => setActivityForm({ ...activityForm, maxParticipants: event.target.value })} className="field-input" /></label>
          <label><span className="field-label">Date</span><input required type="date" value={activityForm.date} onChange={(event) => setActivityForm({ ...activityForm, date: event.target.value })} className="field-input" /></label>
          <label><span className="field-label">Time</span><input required type="time" value={activityForm.time} onChange={(event) => setActivityForm({ ...activityForm, time: event.target.value })} className="field-input" /></label>
          <label className="sm:col-span-2"><span className="field-label">Description</span><textarea required rows={3} value={activityForm.description} onChange={(event) => setActivityForm({ ...activityForm, description: event.target.value })} className="field-input resize-y" /></label>
          <div><button className={primaryClass}>Publish activity</button></div>
        </form>}
        <div className="grid gap-4 lg:grid-cols-2">{activities.map((activity) => <article key={activity.id} className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-start justify-between gap-3"><button type="button" onClick={() => openActivity(activity)} className="text-left"><span className="text-xs font-bold uppercase text-accent">{activityCategoryLabels[activity.category]}</span><h2 className="mt-1 text-lg font-bold text-ink">{activity.title}</h2></button><span className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold">{activity.status}</span></div>
          <p className="mt-2 line-clamp-2 text-sm text-muted">{activity.description}</p><p className="mt-3 text-xs text-muted">{activity.area || 'Nearby'} · {activity.date} at {activity.time} · {activity.participantCount}{activity.maxParticipants ? `/${activity.maxParticipants}` : ''} joined</p>
          <p className="mt-1 text-xs text-muted">Organized by {activity.organizer.name || 'Neighbor'}{activity.distanceKm === null ? '' : ` · ${activity.distanceKm.toFixed(1)} km`}</p>
          <div className="mt-4 flex flex-wrap gap-2">{activity.isOrganizer ? <><button type="button" onClick={() => openActivity(activity)} className={controlClass}>Manage</button>{activity.status === 'upcoming' && <button type="button" onClick={() => activityStatus(activity, 'ongoing')} className={controlClass}>Start</button>}{['upcoming', 'ongoing'].includes(activity.status) && <button type="button" onClick={() => activityStatus(activity, 'completed')} className={controlClass}>Complete</button>}</> : <button type="button" onClick={() => activityMembership(activity.joined ? 'leave' : 'join', activity)} className={activity.joined ? controlClass : primaryClass}>{activity.joined ? 'Leave' : activity.isFull ? 'Full' : 'Join'}</button>}<button type="button" onClick={() => setReportTarget({ type: 'activity', id: activity.id })} className={controlClass}>Report</button></div>
        </article>)}</div>
        {selectedActivity && <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && setSelectedActivity(null)}><section role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-surface p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase text-accent">{activityCategoryLabels[selectedActivity.category]}</p><h2 className="mt-1 text-xl font-bold text-ink">{selectedActivity.title}</h2></div><button type="button" onClick={() => setSelectedActivity(null)} aria-label="Close activity details"><X size={19} /></button></div><p className="mt-3 text-sm text-muted">{selectedActivity.description}</p><p className="mt-3 text-sm text-muted">{selectedActivity.organizer.name} · {selectedActivity.area} · {selectedActivity.date} at {selectedActivity.time}</p><div className="mt-4 rounded-xl bg-surface-soft p-4"><h3 className="font-bold text-ink">Organizer reputation</h3><p className="mt-1 text-sm text-muted">Trust {selectedActivity.organizer.trustScore ?? '—'} · {selectedActivity.organizer.completedHelp ?? 0} completed helps · {selectedActivity.organizer.verification?.level || 'unverified'}</p></div><div className="mt-4"><h3 className="font-bold text-ink">Participants ({participants.length})</h3><div className="mt-2 divide-y divide-line">{participants.map((person) => <div key={person.userId} className="flex items-center justify-between gap-3 py-2"><div><p className="text-sm font-semibold text-ink">{person.name || 'Neighbor'}{person.role === 'organizer' ? ' · organizer' : ''}</p><p className="text-xs text-muted">Trust {person.trustScore ?? '—'} · {person.verification?.level || 'unverified'}</p></div>{selectedActivity.isOrganizer && person.role !== 'organizer' && person.status === 'joined' && <button type="button" onClick={async () => { await removeActivityParticipant(selectedActivity.id, person.userId); await openActivity(selectedActivity) }} className="text-xs font-semibold text-action">Remove</button>}</div>)}</div></div></section></div>}
      </section>}
      {section === 'trust' && <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">{trust ? <><div className="rounded-xl bg-[#292d27] p-5 text-white"><p className="text-sm text-white/70">Your community trust</p><p className="mt-2 text-5xl font-bold">{trust.trustScore}</p><p className="mt-2 text-sm text-white/70">{trust.confidence} confidence · {trust.rating.average ?? 'No'} rating average</p><div className="mt-5 grid grid-cols-2 gap-3">{Object.entries(trust.breakdown).map(([name, value]) => <div key={name} className="rounded-lg bg-white/10 p-3"><p className="text-xs capitalize text-white/65">{name}</p><p className="mt-1 font-bold">{value}%</p></div>)}</div><div className="mt-4 flex flex-wrap gap-2">{trust.badges.map((badge) => <span key={badge} className="rounded-full bg-white/15 px-3 py-1 text-xs">{badge}</span>)}</div></div><div className="grid gap-5"><section><h2 className="text-lg font-bold text-ink">Verification and reputation</h2><p className="mt-2 text-sm text-muted">Email {trust.verification.email ? 'verified' : 'not verified'} · Phone {trust.verification.phone ? 'verified' : 'not verified'} · Community {trust.verification.level}</p><ul className="mt-3 grid gap-2">{trust.reasons.map((reason) => <li key={reason} className="rounded-lg border border-line px-3 py-2 text-sm text-ink">{reason}</li>)}</ul><p className="mt-3 text-xs text-muted">{trust.note}</p></section><section><h2 className="text-lg font-bold text-ink">Review history</h2><div className="mt-2 divide-y divide-line">{reviews?.items.map((review) => <article key={review.id} className="py-3"><p className="font-semibold text-ink">{review.rating}/5 · {review.reviewer || 'Neighbor'}</p><p className="mt-1 text-sm text-muted">{review.comment || 'No comment'}</p></article>)}{!reviews?.items.length && <p className="py-3 text-sm text-muted">No reviews yet.</p>}</div></section></div><section className="section-rule pt-5 lg:col-span-2"><h2 className="text-lg font-bold text-ink">Completed-help history</h2><div className="mt-3 grid gap-5 sm:grid-cols-2"><div><h3 className="text-sm font-semibold text-muted">Help given</h3>{history?.given.map((item) => <p key={item.id} className="border-b border-line py-3 text-sm text-ink">{item.title} <span className="text-muted">· {item.completedAt?.slice(0, 10) || 'Completed'}</span></p>)}</div><div><h3 className="text-sm font-semibold text-muted">Help received</h3>{history?.received.map((item) => <p key={item.id} className="border-b border-line py-3 text-sm text-ink">{item.title} <span className="text-muted">· {item.completedAt?.slice(0, 10) || 'Completed'}</span></p>)}</div></div></section></> : <p role="status" className="text-sm text-muted">Loading trust profile…</p>}</section>}
      {section === 'safety' && <div className="grid gap-7 lg:grid-cols-2"><section><h2 className="text-lg font-bold text-ink">Find a neighbor</h2><p className="mt-1 text-sm text-muted">Search by name to report or block a user.</p><input value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)} placeholder="Enter at least 2 characters" className="field-input mt-3" /><div className="mt-2 divide-y divide-line">{people.map((person) => <div key={person.id} className="flex items-center justify-between gap-3 py-3"><button type="button" onClick={() => setSelectedPerson(person)} className="text-left"><p className="font-semibold text-ink">{person.name}</p><p className="text-xs text-muted">{person.area || 'Area not set'}</p></button><div className="flex gap-2"><button type="button" onClick={() => setReportTarget({ type: 'user', id: person.id })} className={controlClass}>Report</button><button type="button" onClick={() => submitBlock(person)} className={controlClass}>Block</button></div></div>)}</div>{selectedPerson && <p className="mt-2 text-xs text-muted">Selected: {selectedPerson.name}</p>}<h2 className="mt-8 text-lg font-bold text-ink">Blocked users</h2><div className="mt-2 divide-y divide-line">{blockedUsers.map((blocked) => <div key={blocked.userId} className="flex items-center justify-between py-3"><span className="text-sm text-ink">{blocked.name || blocked.userId}</span><button type="button" onClick={() => unblock(blocked.userId)} className={controlClass}>Unblock</button></div>)}{!blockedUsers.length && <p className="py-3 text-sm text-muted">No blocked users.</p>}</div></section><section><h2 className="text-lg font-bold text-ink">Report a user, request, or message</h2><form onSubmit={submitSafetyReport} className="mt-3 grid gap-3"><select value={reportType} onChange={(event) => setReportType(event.target.value as CommunityReport['targetType'])} className="field-input"><option value="user">User</option><option value="request">Request</option><option value="message">Message</option><option value="activity">Activity</option><option value="service">Service</option></select><input required value={reportId} onChange={(event) => setReportId(event.target.value)} placeholder="Target ID" className="field-input" /><button className={primaryClass}><Flag size={15} />Submit report</button></form><h2 className="mt-8 text-lg font-bold text-ink">My reports</h2><div className="mt-2 divide-y divide-line">{myReports.map((report) => <div key={report.id} className="py-3"><p className="text-sm font-semibold text-ink">{report.targetType} · {report.reason}</p><p className="text-xs text-muted">{report.status} · {report.createdAt.slice(0, 10)}</p></div>)}{!myReports.length && <p className="py-3 text-sm text-muted">No reports submitted.</p>}</div></section></div>}
      {section === 'admin' && user.role === 'admin' && <section><div className="grid gap-3 sm:grid-cols-4">{adminStats && Object.entries(adminStats).map(([key, value]) => <div key={key} className="rounded-xl border border-line bg-surface p-4"><p className="text-xs capitalize text-muted">{key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}</p><p className="mt-1 text-2xl font-bold text-ink">{value}</p></div>)}</div><div className="mt-7 grid gap-8 lg:grid-cols-2"><section><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-ink">Reports</h2><button type="button" onClick={() => listAdminReports().then((result) => setAdminReports(result.items)).catch(fail)} className={controlClass}>Refresh</button></div><div className="mt-3 divide-y divide-line">{adminReports.map((report) => <article key={report.id} className="py-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-ink">{report.targetType} · {report.reason}</p><p className="text-xs text-muted">{report.reporter.name || report.reporter.id} · {report.targetReportCount || 1} report(s) · {report.status}</p><p className="mt-1 text-sm text-muted">{report.details || report.targetId}</p></div><button type="button" onClick={() => moderateRemove(report)} disabled={report.status === 'actioned' || report.targetType === 'user'} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line px-3 text-xs font-semibold disabled:opacity-40"><Trash2 size={13} />Remove</button></div><div className="mt-2 flex flex-wrap gap-2">{(['reviewing', 'dismissed', 'actioned'] as const).map((status) => <button key={status} type="button" onClick={() => updateReport(report, status)} disabled={report.status === status} className={controlClass}>{status}</button>)}</div></article>)}{!adminReports.length && <p className="py-5 text-sm text-muted">No reports to review.</p>}</div></section><section><h2 className="text-lg font-bold text-ink">Reported users and accounts</h2><input value={adminQuery} onChange={(event) => setAdminQuery(event.target.value)} placeholder="Search users" className="field-input mt-3" /><div className="mt-2 divide-y divide-line">{adminUsers.map((person) => <article key={person.id} className="py-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink">{person.name} <span className="text-xs text-muted">· {person.status}</span></p><p className="text-xs text-muted">{person.openReports} open / {person.totalReports} reports · email {person.emailVerified ? 'verified' : 'unverified'} · phone {person.phoneVerified ? 'verified' : 'unverified'}</p></div><button type="button" disabled={person.role === 'admin' || person.id === user.id} onClick={() => toggleSuspension(person)} className={controlClass}>{person.status === 'suspended' ? 'Reinstate' : 'Suspend'}</button></div><div className="mt-2 flex gap-2"><button type="button" onClick={() => toggleAdminVerification(person, 'email')} className={controlClass}>{person.emailVerified ? 'Unverify email' : 'Verify email'}</button><button type="button" onClick={() => toggleAdminVerification(person, 'phone')} className={controlClass}>{person.phoneVerified ? 'Unverify phone' : 'Verify phone'}</button></div></article>)}</div></section></div><section className="section-rule mt-7 pt-5"><h2 className="text-lg font-bold text-ink">Moderation log</h2><div className="mt-2 divide-y divide-line">{moderationLog.slice(0, 10).map((item) => <p key={item.id} className="py-2 text-xs text-muted">{item.action} · {item.targetType} {item.targetId} · {item.createdAt.slice(0, 10)}</p>)}</div></section></section>}
      {reportTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && setReportTarget(null)}><div className="w-full max-w-md"><ReportForm targetType={reportTarget.type} targetId={reportTarget.id} onSubmit={submitReport} onCancel={() => setReportTarget(null)} /></div></div>}
    </div>
  )
}
