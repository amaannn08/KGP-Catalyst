import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { Bell, Flame, Info, TrendingUp, AlertTriangle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const URGENCY_CONFIG = {
  critical: { icon: Flame,         color: '#f87171', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.2)',   label: 'CRITICAL',  labelColor: '#f87171' },
  warning:  { icon: AlertTriangle, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.2)',  label: 'WARNING',   labelColor: '#fbbf24' },
  info:     { icon: Info,          color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',   border: 'rgba(56,189,248,0.2)',  label: 'INTEL',     labelColor: '#38bdf8' },
  positive: { icon: TrendingUp,    color: '#34d399', bg: 'rgba(52,211,153,0.08)',   border: 'rgba(52,211,153,0.2)',  label: 'SURGE',     labelColor: '#34d399' },
}

function timeAgo(isoString) {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000
  if (diff < 60)    return `${Math.round(diff)}s ago`
  if (diff < 3600)  return `${Math.round(diff / 60)}m ago`
  return `${Math.round(diff / 3600)}h ago`
}

function NotifCard({ notif }) {
  const cfg = URGENCY_CONFIG[notif.urgency] ?? URGENCY_CONFIG.info
  const Icon = cfg.icon

  return (
    <Motion.div
      initial={{ opacity: 0, x: 20, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="rounded-xl p-2.5"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          <Icon size={12} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="text-[8px] font-bold tracking-widest"
              style={{ color: cfg.labelColor }}
            >
              {cfg.label}
            </span>
            <span className="text-[9px] text-gray-600 ml-auto">{timeAgo(notif.timestamp)}</span>
          </div>
          <p className="text-[10px] leading-relaxed text-gray-300">{notif.message}</p>
        </div>
      </div>
    </Motion.div>
  )
}

const POLL_INTERVAL = 20_000

export default function NotificationFeed() {
  const [notifications, setNotifications] = useState([])

  const fetchNotifs = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/notifications`)
      const json = await res.json()
      if (Array.isArray(json.notifications)) {
        setNotifications(json.notifications)
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchNotifs])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Bell size={11} className="text-gray-500" />
        <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-500">Campus Alerts</span>
        {notifications.length > 0 && (
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-red-900/60 text-red-400 font-bold">
            {notifications.length}
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center text-xs text-gray-700 py-4">
          Monitoring sensors…
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence initial={false}>
            {notifications.map(n => (
              <NotifCard key={n.id} notif={n} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
