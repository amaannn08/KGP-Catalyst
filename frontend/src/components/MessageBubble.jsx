import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion as Motion } from 'framer-motion'
import { User, Sparkles, Copy, Check } from 'lucide-react'
import { useState } from 'react'

const anim = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000) }
  return (
    <button type="button" onClick={copy}
      className={`min-h-9 px-2.5 flex items-center gap-1 rounded-lg text-[11px] bg-gray-800 border border-gray-700 transition-colors tap-none ${done ? 'text-emerald-400 border-emerald-800' : 'text-gray-500 hover:text-gray-300 active:bg-gray-700'}`}>
      {done ? <Check size={10} /> : <Copy size={10} />}
      {done ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <Motion.div variants={anim} initial="hidden" animate="visible"
        className="flex justify-end items-end gap-2 sm:gap-3">
        <div className="max-w-[min(92%,24rem)] sm:max-w-[78%] px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed"
          style={{ background: 'linear-gradient(135deg,#1d4ed8,#4f46e5)', color: '#eff6ff',
            boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}>
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
        style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow: '0 2px 10px rgba(59,130,246,0.4)' }}>
        <Sparkles size={11} className="text-white" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* Content card */}
        <div className="rounded-2xl rounded-tl-sm bg-gray-900 border border-gray-800 px-3 py-3 sm:px-5 sm:py-4 overflow-x-auto">
          <div className="prose-ai">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>

          {/* Sources */}
          {message.sources?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-800 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-gray-600 font-medium">Sources:</span>
              {message.sources.map((src, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-950 border border-blue-900 text-blue-400">
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
