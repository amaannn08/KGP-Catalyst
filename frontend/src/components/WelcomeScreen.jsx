import { motion as Motion } from 'framer-motion'
import { Leaf, BookOpen, Coffee, Recycle, Users, Zap } from 'lucide-react'

const CARDS = [
  { icon: Leaf,    color: '#34d399', bg: 'rgba(52,211,153,0.12)',   border: 'rgba(52,211,153,0.25)',   title: 'Sustainability habits',  sub: 'What small changes are actually happening?',      prompt: 'How do KGP students think about sustainability on campus? What small changes are people actually making?' },
  { icon: BookOpen,color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',   title: 'Academic pressure',      sub: 'How students cope with stress at IIT KGP',        prompt: 'What does academic stress really look like at IIT KGP and how do students cope with it?' },
  { icon: Coffee,  color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.25)',   title: 'Campus food culture',    sub: 'Mess food, Nescafe & food trucks',                 prompt: 'Tell me about the food culture at KGP — mess food, Nescafe, food trucks.' },
  { icon: Recycle, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)',   title: 'Waste & environment',    sub: 'What students actually say about waste',           prompt: 'How does waste management work (or not work) at IIT KGP?' },
  { icon: Users,   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)',  title: 'Social dynamics',        sub: 'Unspoken norms outsiders never see',               prompt: "What are the unspoken social norms at IIT KGP that outsiders wouldn't know about?" },
  { icon: Zap,     color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.25)',  title: 'Energy consumption',     sub: 'Do students care about their footprint?',          prompt: 'How aware are KGP students about their energy footprint?' },
]

const wrap = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item  = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22,1,0.36,1] } } }

export default function WelcomeScreen({ onPrompt }) {
  return (
    <Motion.div
      variants={wrap} initial="hidden" animate="show"
      className="flex flex-col items-stretch sm:items-center justify-start sm:justify-center min-h-full max-h-full h-full px-3 py-2 sm:px-5 sm:py-4 gap-2 sm:gap-4 overflow-y-auto overscroll-contain"
    >
      {/* ── Hero (compact on phone) ─────────────────────────────────── */}
      <Motion.div variants={item} className="text-center shrink-0 max-w-md mx-auto px-0.5">
        <div
          className="hidden sm:inline-flex items-center justify-center w-11 h-11 rounded-xl mb-2 sm:mb-3"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow: '0 6px 24px rgba(59,130,246,0.28)' }}
        >
          <Leaf size={20} className="text-white" />
        </div>

        <h1 className="text-lg sm:text-2xl font-bold text-white mb-0.5 sm:mb-1 tracking-tight">KGP Catalyst</h1>
        <p className="text-gray-400 text-[10px] sm:text-xs max-w-[20rem] sm:max-w-sm mx-auto leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
          Socratic chat for IIT Kharagpur campus life, grounded in student voices from Reddit.
        </p>
      </Motion.div>

      {/* Section label — desktop only (saves a line on small phones) */}
      <Motion.p
        variants={item}
        className="hidden sm:block text-[11px] font-semibold uppercase tracking-widest text-gray-600 text-center shrink-0"
      >
        Choose a topic to explore
      </Motion.p>

      {/* ── Cards: one column on phone for calmer layout ───────────── */}
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
              className="text-left p-2 sm:p-3 rounded-lg sm:rounded-2xl bg-gray-900/80 border border-gray-800 hover:border-gray-600 active:border-gray-600 transition-colors duration-200 group cursor-pointer"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 sm:items-start sm:mb-0">
                <div
                  className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
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

      {/* Redundant next to composer on narrow screens */}
      <Motion.p variants={item} className="hidden sm:block text-center text-xs text-gray-700 shrink-0 pb-1">
        Or type your own question below ↓
      </Motion.p>
    </Motion.div>
  )
}
