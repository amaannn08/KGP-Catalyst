import { useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { MessageSquare, Plus, Leaf, Trash2 } from 'lucide-react'

export default function Sidebar({ sessions, activeId, onNew, onSelect, onDelete, isOpen }) {
  const [deleting, setDeleting] = useState(null)

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    setDeleting(id)
    try {
      await onDelete(id)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <aside
      id="conversation-sidebar"
      className={[
        'flex flex-col bg-gray-900 border-gray-800 overflow-hidden flex-shrink-0',
        /* Mobile drawer */
        'fixed z-40 inset-y-0 left-0 w-[min(280px,88vw)] max-w-[100vw] border-r shadow-2xl',
        'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
        'transition-transform duration-300 ease-out motion-reduce:transition-none',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        /* Desktop: in-flow strip */
        'md:static md:z-auto md:max-w-none md:shadow-none md:translate-x-0',
        'md:transition-[width,min-width] md:duration-300 md:motion-reduce:transition-none',
        isOpen ? 'md:w-[260px] md:min-w-[260px] md:border-r' : 'md:w-0 md:min-w-0 md:border-transparent md:overflow-hidden md:pointer-events-none',
      ].join(' ')}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 min-h-14 border-b border-gray-800 flex-shrink-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)' }}
        >
          <Leaf size={13} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-100 whitespace-nowrap truncate">KGP Catalyst</span>
      </div>

      {/* New Chat */}
      <div className="px-3 py-3 flex-shrink-0">
        <button
          type="button"
          onClick={onNew}
          className="w-full min-h-11 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-medium transition-colors whitespace-nowrap tap-none"
        >
          <Plus size={15} strokeWidth={2.5} />
          New conversation
        </button>
      </div>

      {/* Section label */}
      {sessions.length > 0 && (
        <div className="px-4 pb-1 flex-shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Recents</p>
        </div>
      )}

      {/* Session list */}
      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 space-y-0.5 pb-4 touch-pan-y">
        <AnimatePresence initial={false}>
          {sessions.map((s) => {
            const isActive = s.id === activeId

            return (
              <Motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="relative group"
              >
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className={`w-full min-h-11 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-colors tap-none ${
                    isActive
                      ? 'bg-gray-800 text-slate-100 border border-gray-700'
                      : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 border border-transparent active:bg-gray-800/80'
                  }`}
                >
                  <MessageSquare size={13} className="flex-shrink-0 opacity-60" />
                  <span className="truncate flex-1 pr-10 min-w-0">{s.title}</span>
                </button>

                {/* Mobile: delete always visible; md+: fade in on row hover */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, s.id)}
                  disabled={deleting === s.id}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-9 min-w-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950 active:bg-red-950/80 transition-opacity duration-150 tap-none opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-40"
                  title="Delete chat"
                  aria-label={`Delete ${s.title}`}
                >
                  {deleting === s.id ? (
                    <span className="w-3.5 h-3.5 border border-gray-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </Motion.div>
            )
          })}
        </AnimatePresence>

        {sessions.length === 0 && (
          <p className="text-center text-xs text-gray-700 pt-8 px-4">
            No conversations yet.
            <br />
            Start one above!
          </p>
        )}
      </nav>
    </aside>
  )
}
