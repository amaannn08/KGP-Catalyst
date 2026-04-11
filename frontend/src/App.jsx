import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { PanelLeft, AlertCircle, X } from 'lucide-react'

import Sidebar from './components/Sidebar.jsx'
import MessageBubble from './components/MessageBubble.jsx'
import ThinkingBubble from './components/ThinkingBubble.jsx'
import ChatInput from './components/ChatInput.jsx'
import WelcomeScreen from './components/WelcomeScreen.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const makeId   = () => Math.random().toString(36).slice(2, 10)

// ─── device_id — stable browser identity (no auth needed) ────────────────────
function getDeviceId() {
  let id = localStorage.getItem('kgp_device_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('kgp_device_id', id) }
  return id
}
const DEVICE_ID = getDeviceId()

// ─── API helpers ──────────────────────────────────────────────────────────────
const api = {
  getSessions:  ()       => fetch(`${API_BASE}/api/sessions?device_id=${DEVICE_ID}`).then(r => r.json()),
  createSession:(title)  => fetch(`${API_BASE}/api/sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device_id: DEVICE_ID, title }) }).then(r => r.json()),
  deleteSession:(id)     => fetch(`${API_BASE}/api/sessions/${id}`, { method: 'DELETE' }),
  renameSession:(id, t)  => fetch(`${API_BASE}/api/sessions/${id}`, { method: 'PATCH',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t }) }),
  getMessages:  (id)     => fetch(`${API_BASE}/api/sessions/${id}/messages`).then(r => r.json()),
}

export default function App() {
  const [sessions,    setSessions]    = useState([])
  const [activeId,    setActiveId]    = useState(null)
  const [messages,    setMessages]    = useState([])   // messages for active session
  // Start closed everywhere; open on desktop only after layout (mobile stays hidden)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading,   setIsLoading]   = useState(false)
  const [isFetching,  setIsFetching]  = useState(true) // initial load
  const [error,       setError]       = useState(null)
  const bottomRef = useRef(null)

  const activeSession = sessions.find(s => s.id === activeId) ?? null

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(min-width: 768px)').matches) setSidebarOpen(true)
  }, [])

  // ── Scroll to bottom on new messages ──────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── On every full load: fetch history, then always start a fresh session ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await api.getSessions()
        if (!cancelled) setSessions(Array.isArray(rows) ? rows : [])
      } catch {
        if (!cancelled) setSessions([])
      }
      try {
        const session = await api.createSession('New conversation')
        if (cancelled) return
        setSessions(prev => [session, ...prev.filter(s => s.id !== session.id)])
        setActiveId(session.id)
        setMessages([])
        setError(null)
      } catch {
        if (!cancelled) setError('Could not create new chat. Is the backend running?')
      } finally {
        if (!cancelled) setIsFetching(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ── Load messages for a session ───────────────────────────────────────────
  const loadMessages = useCallback((sessionId) => {
    setMessages([])
    api.getMessages(sessionId)
      .then(rows => {
        if (!Array.isArray(rows)) return
        setMessages(rows.map(r => ({
          id:      r.id,
          role:    r.role,
          content: r.content,
          sources: r.sources ?? [],
        })))
      })
      .catch(() => setMessages([]))
  }, [])

  // ── Select a session ──────────────────────────────────────────────────────
  const selectSession = useCallback((id) => {
    if (id === activeId) return
    setActiveId(id)
    setError(null)
    loadMessages(id)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setSidebarOpen(false)
    }
  }, [activeId, loadMessages])

  // ── Create a new session ──────────────────────────────────────────────────
  const newSession = useCallback(async () => {
    try {
      const session = await api.createSession('New conversation')
      setSessions(p => [session, ...p])
      setActiveId(session.id)
      setMessages([])
      setError(null)
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
        setSidebarOpen(false)
      }
    } catch {
      setError('Could not create new chat. Is the backend running?')
    }
  }, [])

  // ── Delete a session ──────────────────────────────────────────────────────
  const deleteSession = useCallback(async (id) => {
    await api.deleteSession(id)
    setSessions(p => {
      const next = p.filter(s => s.id !== id)
      if (id === activeId) {
        if (next.length > 0) { setActiveId(next[0].id); loadMessages(next[0].id) }
        else                 { setActiveId(null); setMessages([]) }
      }
      return next
    })
  }, [activeId, loadMessages])

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    if (!text.trim() || isLoading || !activeId) return
    setError(null)

    const sessionId      = activeId
    const historySnapshot = messages.slice()

    const userMsg = { id: makeId(), role: 'user',      content: text }
    const aiId    = makeId()
    const aiMsg   = { id: aiId,    role: 'assistant', content: '', sources: [] }

    // Add both optimistically — one atomic state update
    setMessages(prev => [...prev, userMsg, aiMsg])

    // Update session title after first message
    if (messages.length === 0) {
      const title = text.slice(0, 45) + (text.length > 45 ? '…' : '')
      api.renameSession(sessionId, title).catch(() => {})
      setSessions(p => p.map(s => s.id === sessionId ? { ...s, title } : s))
    }

    setIsLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, history: historySnapshot, session_id: sessionId }),
      })

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Server error ${res.status}`)
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const raw = trimmed.slice(5).trim()
          if (raw === '[DONE]') break outer

          try {
            const evt = JSON.parse(raw)
            if (evt.type === 'token') {
              setMessages(prev => prev.map(m =>
                m.id === aiId ? { ...m, content: m.content + evt.content } : m
              ))
            } else if (evt.type === 'sources') {
              setMessages(prev => prev.map(m =>
                m.id === aiId ? { ...m, sources: evt.sources } : m
              ))
            } else if (evt.type === 'error') {
              throw new Error(evt.error)
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.startsWith('Unexpected')) throw parseErr
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the backend running?')
      setMessages(prev => prev.filter(m => m.id !== aiId))
    } finally {
      setIsLoading(false)
    }
  }, [activeId, messages, isLoading])

  // ─── Render ───────────────────────────────────────────────────────────────
  if (isFetching) {
    return (
      <div className="flex min-h-dvh h-dvh bg-gray-950 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)' }}>
            <span className="text-white text-lg">⚡</span>
          </div>
          <div className="flex gap-1.5">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-dvh h-dvh bg-gray-950 text-slate-200 overflow-hidden pt-[env(safe-area-inset-top)]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Mobile: tap outside to close drawer */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close conversation list"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[1px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onNew={newSession}
        onSelect={selectSession}
        onDelete={deleteSession}
        isOpen={sidebarOpen}
      />

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden w-full max-w-full">

        {/* Header */}
        <header className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 min-h-12 sm:min-h-14 py-1.5 sm:py-2 bg-gray-900 border-b border-gray-800 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(v => !v)}
            className="min-h-11 min-w-11 shrink-0 -ml-1 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors tap-none"
            aria-expanded={sidebarOpen}
            aria-controls="conversation-sidebar"
          >
            <PanelLeft size={18} />
          </button>

          <div className="flex-1 min-w-0 pr-1">
            <p className="text-sm font-semibold text-slate-100 truncate leading-tight">
              {activeSession?.title ?? 'KGP Catalyst'}
            </p>
            {messages.length > 0 && (
              <p className="hidden sm:block text-xs text-gray-500">{messages.length} messages</p>
            )}
          </div>

        </header>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <Motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-start sm:items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 bg-red-950 border-b border-red-900 text-red-300 text-xs sm:text-sm flex-shrink-0"
            >
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5 sm:mt-0" />
              <span className="flex-1 min-w-0 break-words">{error}</span>
              <button type="button" onClick={() => setError(null)} className="min-h-9 min-w-9 shrink-0 flex items-center justify-center text-red-500 hover:text-red-300 tap-none" aria-label="Dismiss error"><X size={16} /></button>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {messages.length === 0 && !isLoading && activeId
            ? <WelcomeScreen onPrompt={handleSend} />
            : !activeId
            ? (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                Create a new conversation to get started
              </div>
            )
            : (
              <div className="max-w-3xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 pb-[env(safe-area-inset-bottom)]">
                <AnimatePresence initial={false}>
                  {messages
                    .filter(msg => msg.role === 'user' || msg.content.length > 0)
                    .map(msg => <MessageBubble key={msg.id} message={msg} />)
                  }
                </AnimatePresence>
                {isLoading && messages[messages.length - 1]?.content === '' && <ThinkingBubble />}
                <div ref={bottomRef} />
              </div>
            )
          }
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} isLoading={isLoading} disabled={!activeId} />
      </div>
    </div>
  )
}
