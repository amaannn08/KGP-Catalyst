import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { Zap, Droplets, Recycle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const REFRESH_INTERVAL = 15_000 // 15 seconds

const CHALLENGE_COLORS = {
  energy:  { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)',  text: '#fbbf24', icon: Zap },
  water:   { bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.25)',  text: '#38bdf8', icon: Droplets },
  waste:   { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)',  text: '#34d399', icon: Recycle },
}

const RANK_MEDAL = ['🥇', '🥈', '🥉', '4th', '5th', '6th']

function ScoreBar({ value, color }) {
  return (
    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full score-bar"
        style={{ width: `${value}%`, background: color, transitionDuration: '0.8s' }}
      />
    </div>
  )
}

function HallRow({ hall, isExpanded, onToggle }) {
  const delta = Math.random() > 0.5 ? 1 : -1
  const deltaVal = (Math.random() * 1.2).toFixed(1)

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors tap-none"
      >
        {/* Rank */}
        <span className="text-sm w-6 flex-shrink-0 text-center">
          {RANK_MEDAL[hall.rank - 1] ?? hall.rank}
        </span>

        {/* Name */}
        <span className="flex-1 text-left text-xs font-semibold text-slate-200 truncate">
          {hall.name} Hall
        </span>

        {/* Delta */}
        <span className={`text-[10px] font-mono flex-shrink-0 ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {delta > 0 ? '▲' : '▼'}{deltaVal}
        </span>

        {/* Score */}
        <span className="text-xs font-bold text-white flex-shrink-0 w-10 text-right">
          {hall.composite}
        </span>
      </button>

      {/* Expanded: challenge breakdown */}
      <AnimatePresence>
        {isExpanded && (
          <Motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-2">
              {Object.entries(CHALLENGE_COLORS).map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <div key={key}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={10} style={{ color: cfg.text }} />
                      <span className="text-[10px] text-gray-500 capitalize">{key}</span>
                      <span className="ml-auto text-[10px] font-mono" style={{ color: cfg.text }}>{hall[key]}</span>
                    </div>
                    <ScoreBar value={hall[key]} color={cfg.text} />
                  </div>
                )
              })}

              {/* Internal blocks */}
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-[9px] uppercase tracking-wider text-gray-600 mb-1.5">Internal Block Rankings</p>
                {hall.blocks
                  .slice()
                  .sort((a, b) => b.composite - a.composite)
                  .map((blk, i) => (
                    <div key={blk.block} className="flex items-center gap-2 py-0.5">
                      <span className="text-[9px] text-gray-600 w-3">{i + 1}</span>
                      <span className="text-[10px] text-gray-400 flex-1">{blk.block}</span>
                      <span className="text-[10px] font-mono text-emerald-400">{blk.composite}</span>
                    </div>
                  ))}
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Leaderboard({ isPipelineActive }) {
  const [data, setData]         = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leaderboard`)
      const json = await res.json()
      setData(json)
      setLastUpdate(new Date())
    } catch { /* silent — demo mode */ }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [fetchData])

  const toggle = (name) => setExpanded(e => e === name ? null : name)

  if (!data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex gap-1.5">
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-dot" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-500">Live Rankings</span>
          {/* Live indicator */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>
        {lastUpdate && (
          <span className="text-[9px] text-gray-600">
            {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {/* Challenge legend */}
      <div className="flex gap-2 mb-1">
        {Object.entries(CHALLENGE_COLORS).map(([key, cfg]) => {
          const Icon = cfg.icon
          return (
            <div key={key} className="flex items-center gap-1">
              <Icon size={9} style={{ color: cfg.text }} />
              <span className="text-[9px] text-gray-600 capitalize">{key}</span>
            </div>
          )
        })}
      </div>

      {/* Hall rows */}
      <div className="space-y-1.5">
        {data.halls.map(hall => (
          <HallRow
            key={hall.name}
            hall={hall}
            isExpanded={expanded === hall.name}
            onToggle={() => toggle(hall.name)}
          />
        ))}
      </div>
    </div>
  )
}
