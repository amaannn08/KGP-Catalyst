import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PanelLeft, AlertCircle, X, Radio } from 'lucide-react'

import Sidebar from './components/Sidebar.jsx'
import MessageBubble from './components/MessageBubble.jsx'
import ThinkingBubble from './components/ThinkingBubble.jsx'
import ChatInput from './components/ChatInput.jsx'
import WelcomeScreen from './components/WelcomeScreen.jsx'

const makeId = () => Math.random().toString(36).slice(2, 10)

export default function App() {
  const init = { id: makeId(), title: 'New conversation', messages: [] }
  const [sessions, setSessions] = useState([init])
  const [activeId, setActiveId] = useState(init.id)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  const active = sessions.find(s => s.id === activeId) ?? sessions[0]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active.messages, isLoading])

  const newSession = useCallback(() => {
    const s = { id: makeId(), title: 'New conversation', messages: [] }
    setSessions(p => [s, ...p])
    setActiveId(s.id)
    setError(null)
  }, [])

  const patchSession = useCallback((id, fn) =>
    setSessions(p => p.map(s => s.id === id ? fn(s) : s)), [])

  const handleSend = useCallback(async (text) => {
    if (!text.trim() || isLoading) return
    setError(null)
    const userMsg = { id: makeId(), role: 'user', content: text }
    patchSession(activeId, s => ({
      ...s,
      title: s.messages.length === 0 ? text.slice(0, 40) + (text.length > 40 ? '…' : '') : s.title,
      messages: [...s.messages, userMsg],
    }))
    setIsLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: active.messages }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Error ${res.status}`)
      const data = await res.json()
      patchSession(activeId, s => ({
        ...s,
        messages: [...s.messages, { id: makeId(), role: 'assistant', content: data.reply, sources: data.sources ?? [] }],
      }))
    } catch (err) {
      setError(err.message || 'Backend unreachable. Is the server running on port 5000?')
    } finally {
      setIsLoading(false)
    }
  }, [activeId, active.messages, isLoading, patchSession])

  return (
    <div className="flex h-screen bg-gray-950 text-slate-200 overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onNew={newSession}
        onSelect={id => { setActiveId(id); setError(null) }}
        isOpen={sidebarOpen}
      />

      {/* ── Main ────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <header className="flex items-center gap-3 px-4 h-14 bg-gray-900 border-b border-gray-800 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <PanelLeft size={17} />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">{active.title}</p>
            {active.messages.length > 0 && (
              <p className="text-xs text-gray-500">{active.messages.length} messages</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-medium">
            <Radio size={10} className="animate-pulse" />
            RAG Live
          </div>
        </header>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-3 px-5 py-2.5 bg-red-950 border-b border-red-900 text-red-300 text-sm flex-shrink-0"
            >
              <AlertCircle size={14} className="flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-300"><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto">
          {active.messages.length === 0 && !isLoading
            ? <WelcomeScreen onPrompt={handleSend} />
            : (
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                <AnimatePresence initial={false}>
                  {active.messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
                </AnimatePresence>
                {isLoading && <ThinkingBubble />}
                <div ref={bottomRef} />
              </div>
            )
          }
        </div>

        {/* Input area */}
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  )
}
