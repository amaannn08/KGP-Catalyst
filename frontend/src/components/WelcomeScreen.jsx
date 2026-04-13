import { motion as Motion } from 'framer-motion'
import { Zap, Droplets, Sprout, Trophy, User, BarChart2 } from 'lucide-react'

const CARDS = [
  {
    icon: Zap,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.22)',
    title: '⚡ Energy Conservation',
    sub: 'Why is my hall lagging in energy?',
    prompt: 'Why is Radhakrishnan Hall lagging in the energy conservation efforts? Which blocks need improvement and what patterns are causing this?',
  },
  {
    icon: Droplets,
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.1)',
    border: 'rgba(56,189,248,0.22)',
    title: '💧 Water Challenge',
    sub: 'Which wing has the worst water discipline?',
    prompt: 'Which wing in Block B has the worst water discipline right now? What\'s the anomaly pattern and how does it compare to other wings?',
  },
  {
    icon: Sprout,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.1)',
    border: 'rgba(52,211,153,0.22)',
    title: '🌱 Garden-to-Table',
    sub: 'How is Block D\'s biomass yield doing?',
    prompt: 'How is Block D performing in the Garden-to-Table challenge? Compare their biomass yield efficiency to the hall average.',
  },
  {
    icon: Trophy,
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.1)',
    border: 'rgba(244,114,182,0.22)',
    title: '🏆 Campus Standings',
    sub: 'Compare Radhakrishnan vs AZAD Hall this week',
    prompt: 'Compare Radhakrishnan Hall vs AZAD Hall in sustainability this week. Break down all three areas and explain who is leading and why.',
  },
  {
    icon: User,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
    border: 'rgba(167,139,250,0.22)',
    title: '🧠 My Wing\'s Impact',
    sub: 'What can my wing do to climb the leaderboard?',
    prompt: 'What specific actions can Wing 2, Block B take to climb the leaderboard in the next 48 hours? Give me a concrete action plan.',
  },
  {
    icon: BarChart2,
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.1)',
    border: 'rgba(251,146,60,0.22)',
    title: '📊 Wing Leader Report',
    sub: 'Generate a weekly performance report',
    prompt: 'Generate a Wing Leader report for Block C, Radhakrishnan Hall. Include performance summary, key deviations, comparative insights, and behavioural patterns for this week.',
  },
]

const wrap = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item  = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22,1,0.36,1] } } }

export default function WelcomeScreen({ onPrompt }) {
  return (
    <Motion.div
      variants={wrap} initial="hidden" animate="show"
      className="flex flex-col items-stretch sm:items-center justify-start sm:justify-center min-h-full max-h-full h-full px-3 py-2 sm:px-5 sm:py-4 gap-2 sm:gap-4 overflow-y-auto overscroll-contain"
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Motion.div variants={item} className="text-center shrink-0 max-w-md mx-auto px-0.5">
        <div
          className="hidden sm:inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
          style={{
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            boxShadow: '0 8px 32px rgba(22,163,74,0.4)',
          }}
        >
          <span className="text-2xl">🌿</span>
        </div>

        <h1 className="text-lg sm:text-2xl font-bold text-white mb-0.5 sm:mb-1 tracking-tight">
          KGP Catalyst
        </h1>
        <p className="text-[10px] sm:text-xs text-gray-400 max-w-[22rem] mx-auto leading-relaxed">
          Agentic RAG for IIT KGP. Real-time sensor intelligence, sustainability metrics, and
          transformative campus insights.
        </p>

        {/* Challenge badges */}
        <div className="hidden sm:flex items-center justify-center gap-2 mt-3">
          {[
            { emoji: '⚡', label: 'Energy', color: '#fbbf24' },
            { emoji: '💧', label: 'Water',  color: '#38bdf8' },
            { emoji: '🌱', label: 'Garden', color: '#34d399' },
          ].map(b => (
            <span
              key={b.label}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: b.color }}
            >
              {b.emoji} {b.label}
            </span>
          ))}
        </div>
      </Motion.div>

      {/* Section label */}
      <Motion.p
        variants={item}
        className="hidden sm:block text-[11px] font-semibold uppercase tracking-widest text-gray-600 text-center shrink-0"
      >
        Choose an Intelligence Query
      </Motion.p>

      {/* ── Prompt cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2.5 w-full max-w-3xl mx-auto min-h-0">
        {CARDS.map(c => {
          const Icon = c.icon
          return (
            <Motion.button
              key={c.title}
              variants={item}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => onPrompt(c.prompt)}
              className="text-left p-2 sm:p-3 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-gray-600 active:border-gray-600 transition-colors duration-200 group cursor-pointer"
              style={{ borderColor: c.border.replace('0.22', '0.1') }}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 sm:items-start">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}
                >
                  <Icon size={14} style={{ color: c.color }} />
                </div>
                <div className="min-w-0 flex-1 py-0.5 sm:py-0">
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors leading-snug line-clamp-2">
                    {c.title}
                  </span>
                  <p className="mt-0.5 text-[10px] sm:text-xs text-gray-500 leading-snug group-hover:text-gray-400 transition-colors line-clamp-1 sm:line-clamp-3 sm:mt-1">
                    {c.sub}
                  </p>
                </div>
              </div>
            </Motion.button>
          )
        })}
      </div>

      <Motion.p variants={item} className="hidden sm:block text-center text-xs text-gray-700 shrink-0 pb-1">
        Or ask KGP Catalyst anything about campus sustainability ↓
      </Motion.p>
    </Motion.div>
  )
}
