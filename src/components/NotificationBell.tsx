import { useEffect, useState } from 'react'
import { Bell, Check, MessageCircle, Sparkles, UserCheck, X } from 'lucide-react'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '../lib/api'

function formatNotificationTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'Now'
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

function NotificationIcon({ type }: { type: string }) {
  if (type === 'request_accepted') return <UserCheck size={16} />
  if (type === 'new_message') return <MessageCircle size={16} />
  return <Sparkles size={16} />
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function loadNotifications() {
    try {
      const result = await fetchNotifications()
      setNotifications(result.notifications)
    } catch {
      // The header should remain usable when notification polling is unavailable.
    }
  }

  useEffect(() => {
    void loadNotifications()
    const interval = window.setInterval(() => void loadNotifications(), 30000)
    return () => window.clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter((notification) => !notification.read).length

  async function readNotification(notification: NotificationItem) {
    if (notification.read) return
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item))
    await markNotificationRead(notification.id).catch(() => undefined)
  }

  async function readAll() {
    setLoading(true)
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))
    await markAllNotificationsRead().catch(() => undefined)
    setLoading(false)
  }

  return (
    <div className="notification-menu">
      <button type="button" className={`notification-trigger ${open ? 'is-open' : ''}`} onClick={() => setOpen((current) => !current)} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open}>
        <Bell size={19} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <section className="notification-panel" aria-label="Notifications">
          <header className="notification-panel-header"><div><strong>Notifications</strong><span>{unreadCount ? `${unreadCount} unread` : 'All caught up'}</span></div><button type="button" onClick={() => setOpen(false)} aria-label="Close notifications"><X size={16} /></button></header>
          {notifications.length === 0 ? <p className="notification-empty"><Bell size={20} />No notifications yet.</p> : <div className="notification-list">{notifications.slice(0, 12).map((notification) => <button type="button" key={notification.id} className={`notification-item ${notification.read ? '' : 'is-unread'}`} onClick={() => void readNotification(notification)}><span className="notification-item-icon"><NotificationIcon type={notification.type} /></span><span className="notification-item-copy"><strong>{notification.title}</strong><span>{notification.body}</span><time>{formatNotificationTime(notification.createdAt)}</time></span>{!notification.read && <span className="notification-dot" />}</button>)}</div>}
          {unreadCount > 0 && <button type="button" className="notification-read-all" onClick={() => void readAll()} disabled={loading}><Check size={14} /> Mark all as read</button>}
        </section>
      )}
    </div>
  )
}