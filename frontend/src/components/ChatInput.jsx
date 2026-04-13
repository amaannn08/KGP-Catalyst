import { useState, useRef, useEffect } from 'react'
import { motion as Motion } from 'framer-motion'
import { ArrowUp, Square } from 'lucide-react'

export default function ChatInput({ onSend, isLoading, disabled = false }) {
  const [input, setInput] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = Math.min(ref.current.scrollHeight, 160) + 'px'
  }, [input])

  const send = () => {
    const t = input.trim()
    if (!t || isLoading || disabled) return
    onSend(t)
    setInput('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }
  const canSend = input.trim().length > 0 && !isLoading && !disabled

  return (
    <div className="flex-shrink-0 px-2.5 sm:px-4 pt-1.5 sm:pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6" style={{ background: '#020a04' }}>
    <div className="max-w-3xl mx-auto w-full">

        {/* Input card */}
        <div
          className="rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl transition-colors duration-200"
          style={{ background: '#0a1a0f', border: '1px solid rgba(34,197,94,0.2)' }}
          onFocus={() => {}}
        >

          {/* Textarea row */}
          <div className="flex items-end gap-2 sm:gap-3 px-2.5 sm:px-4 pt-2 sm:pt-4 pb-2 sm:pb-3">
            <textarea
              ref={ref}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={isLoading || disabled}
              enterKeyHint="send"
              placeholder="Ask KGP Catalyst about sustainability metrics..."
              className="flex-1 min-w-0 bg-transparent text-slate-200 placeholder-gray-600 text-base md:text-sm resize-none outline-none leading-snug sm:leading-relaxed min-h-[44px] max-h-32 sm:max-h-40 overflow-y-auto disabled:opacity-40 tap-none"
            />

            {/* Send button */}
            <Motion.button
              type="button"
              onClick={send}
              disabled={(!canSend && !isLoading) || disabled}
              whileHover={canSend && !disabled ? { scale: 1.08 } : {}}
              whileTap={canSend && !disabled ? { scale: 0.92 } : {}}
              className={`flex-shrink-0 min-h-11 min-w-11 rounded-xl flex items-center justify-center mb-0.5 transition-all duration-200 tap-none ${
                canSend && !disabled
                  ? 'text-white shadow-lg'
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              style={canSend && !disabled ? { background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 4px 16px rgba(22,163,74,0.35)' } : { background: 'rgba(255,255,255,0.05)' }}
            >
              {isLoading ? <Square size={14} fill="currentColor" /> : <ArrowUp size={16} strokeWidth={2.5} />}
            </Motion.button>
          </div>

          {/* Bottom hint row — hidden on narrow phones to save vertical space */}
          <div className="hidden sm:flex items-center justify-between px-4 pb-3">
            <span className="text-[11px] text-gray-700">
              <kbd className="bg-gray-800 border border-gray-700 rounded px-1 py-px text-[10px] text-gray-600 font-mono">Enter</kbd>
              {' '}send &nbsp;·&nbsp;{' '}
              <kbd className="bg-gray-800 border border-gray-700 rounded px-1 py-px text-[10px] text-gray-600 font-mono">Shift+Enter</kbd>
              {' '}newline
            </span>
            {input.length > 0 && (
              <span className="text-[11px] text-gray-700">{input.length} chars</span>
            )}
          </div>
        </div>

        {/* Disclaimer — hidden on phone to free vertical space */}
        <p className="hidden sm:block text-center text-[11px] text-gray-700 mt-2 px-1 leading-snug">
          Answers grounded in real IIT KGP RAG corpus · Agentic RAG · Mezirow TL · MIND-SAFE
        </p>
      </div>
    </div>
  )
}
