import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
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
    if (!t || isLoading) return
    onSend(t)
    setInput('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }
  const canSend = input.trim().length > 0 && !isLoading

  return (
    <div className="flex-shrink-0 px-4 pb-6 pt-3 bg-gray-950">
      <div className="max-w-3xl mx-auto">

        {/* Input card */}
        <div className="rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl focus-within:border-blue-600 transition-colors duration-200">

          {/* Textarea row */}
          <div className="flex items-end gap-3 px-4 pt-4 pb-3">
            <textarea
              ref={ref}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={isLoading}
              placeholder="Ask anything about campus life at IIT KGP…"
              className="flex-1 bg-transparent text-slate-200 placeholder-gray-600 text-sm resize-none outline-none leading-relaxed min-h-6 max-h-40 overflow-y-auto disabled:opacity-40"
            />

            {/* Send button */}
            <motion.button
              onClick={send}
              disabled={!canSend && !isLoading}
              whileHover={canSend ? { scale: 1.08 } : {}}
              whileTap={canSend ? { scale: 0.92 } : {}}
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mb-0.5 transition-all duration-200 ${
                canSend
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              {isLoading ? <Square size={13} fill="currentColor" /> : <ArrowUp size={15} strokeWidth={2.5} />}
            </motion.button>
          </div>

          {/* Bottom hint row */}
          <div className="flex items-center justify-between px-4 pb-3">
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

        {/* Disclaimer */}
        <p className="text-center text-[11px] text-gray-700 mt-2">
          Answers grounded in real IIT KGP campus discourse · Always think critically
        </p>
      </div>
    </div>
  )
}
