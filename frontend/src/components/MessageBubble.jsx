import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion as Motion } from 'framer-motion'
import { User, Leaf, Copy, Check, Flame } from 'lucide-react'
import { useState, useMemo } from 'react'

const anim = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
}

// Extract Mezirow phase tag from message content
function extractPhase(content) {
  const match = content.match(/\[Phase\s*(\d+)[^\]]*\]/i)
  if (!match) return null
  return match[0].replace(/^\[|\]$/g, '')
}

// Detect if this is a "Hall Alert" (competitive provocation)
function isHallAlert(content) {
  const triggers = ['trailing', 'lap you', 'dragging', 'behind', 'losing', 'slipped', 'costing you', 'not helping', 'dominating']
  const lower = content.toLowerCase()
  return triggers.some(t => lower.includes(t))
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000) }
  return (
    <button type="button" onClick={copy}
      className={`min-h-9 px-2.5 flex items-center gap-1 rounded-lg text-[11px] transition-colors tap-none ${done ? 'text-emerald-400 border-emerald-800' : 'text-gray-500 hover:text-gray-300 active:bg-gray-700'}`}
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${done ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)'}` }}
    >
      {done ? <Check size={10} /> : <Copy size={10} />}
      {done ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const phase = useMemo(() => isUser ? null : extractPhase(message.content), [isUser, message.content])
  const hallAlert = useMemo(() => isUser ? false : isHallAlert(message.content), [isUser, message.content])

  if (isUser) {
    return (
      <Motion.div variants={anim} initial="hidden" animate="visible"
        className="flex justify-end items-end gap-2 sm:gap-3">
        <div className="max-w-[min(92%,24rem)] sm:max-w-[78%] px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed"
          style={{
            background: 'linear-gradient(135deg, #15803d, #166534)',
            color: '#f0fdf4',
            boxShadow: '0 4px 20px rgba(22,163,74,0.25)',
          }}>
          {message.content}
        </div>
        <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0 max-sm:hidden">
          <User size={13} className="text-gray-500" />
        </div>
      </Motion.div>
    )
  }

  return (
    <Motion.div variants={anim} initial="hidden" animate="visible"
      className="flex gap-2 sm:gap-3 items-start min-w-0">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1"
        style={{
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          boxShadow: '0 2px 12px rgba(22,163,74,0.4)',
        }}>
        <Leaf size={11} className="text-white" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* Phase + Hall Alert badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {phase && (
            <span
              className="phase-badge px-2 py-0.5 rounded-full text-emerald-300"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}
            >
              {phase}
            </span>
          )}
          {hallAlert && (
            <span
              className="phase-badge px-2 py-0.5 rounded-full flex items-center gap-1 text-red-300"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <Flame size={8} />
              HALL ALERT
            </span>
          )}
        </div>

        {/* Content card */}
        <div className="rounded-2xl rounded-tl-sm overflow-x-auto"
          style={{
            background: 'rgba(10, 28, 15, 0.7)',
            border: hallAlert ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(34,197,94,0.1)',
            padding: '12px 16px',
          }}>
          <div className="prose-ai">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>

          {/* Sources */}
          {message.sources?.length > 0 && (
            <div className="mt-4 pt-3 flex flex-wrap items-center gap-2" style={{ borderTop: '1px solid rgba(34,197,94,0.1)' }}>
              <span className="text-[11px] text-gray-600 font-medium">Sources:</span>
              {message.sources.map((src, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full text-emerald-400"
                  style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  r/{src}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 pl-0 sm:pl-1">
          <CopyBtn text={message.content} />
        </div>
      </div>
    </Motion.div>
  )
}
