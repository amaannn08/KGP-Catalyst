import { useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import DataPipeline from './DataPipeline.jsx'



export default function Sidebar({ sessions, activeId, onNew, onSelect, onDelete, isOpen, isPipelineActive }) {
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
        'flex flex-col overflow-hidden flex-shrink-0',
        'fixed z-40 inset-y-0 left-0 w-[min(280px,88vw)] max-w-[100vw] border-r shadow-2xl',
        'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
        'transition-transform duration-300 ease-out motion-reduce:transition-none',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'md:static md:z-auto md:max-w-none md:shadow-none md:translate-x-0',
        'md:transition-[width,min-width] md:duration-300 md:motion-reduce:transition-none',
        isOpen ? 'md:w-[240px] md:min-w-[240px] md:border-r' : 'md:w-0 md:min-w-0 md:border-transparent md:overflow-hidden md:pointer-events-none',
      ].join(' ')}
      style={{ background: '#060f08', borderColor: 'rgba(34,197,94,0.1)' }}
    >


      {/* New Chat */}
      <div className="px-3 py-3 flex-shrink-0">
        <button
          type="button"
          onClick={onNew}
          className="w-full min-h-11 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white text-sm font-medium transition-all whitespace-nowrap tap-none"
          style={{
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            boxShadow: '0 4px 16px rgba(22,163,74,0.25)',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          New Query
        </button>
      </div>

      {/* Section label */}
      {sessions.length > 0 && (
        <div className="px-4 pb-1 flex-shrink-0">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-700">Recent Queries</p>
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
                  className={`w-full min-h-11 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all tap-none ${
                    isActive
                      ? 'text-emerald-300'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  style={{
                    background: isActive ? 'rgba(22,163,74,0.1)' : 'transparent',
                    border: isActive ? '1px solid rgba(22,163,74,0.2)' : '1px solid transparent',
                  }}
                >
                  <MessageSquare size={13} className="flex-shrink-0 opacity-60" />
                  <span className="truncate flex-1 pr-10 min-w-0 text-xs">{s.title}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, s.id)}
                  disabled={deleting === s.id}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-9 min-w-9 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 transition-opacity duration-150 tap-none opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-40"
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
            No queries yet.<br />Ask KGP Catalyst above!
          </p>
        )}
      </nav>

      <div className="px-3 pb-3 flex-shrink-0">
        <div className="rounded-xl overflow-hidden p-3" style={{ background: 'rgba(6,15,8,0.7)', border: '1px solid rgba(34,197,94,0.1)' }}>
          <h2 className="text-[9px] font-semibold uppercase tracking-widest text-emerald-700 mb-3 px-1">Agentic Pipeline</h2>
          <DataPipeline isActive={isPipelineActive} inSidebar={true} />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(34,197,94,0.08)' }}>
        <p className="text-[8px] text-gray-700 text-center leading-relaxed">
          Agentic RAG · Mezirow TL · MIND-SAFE
        </p>
      </div>
    </aside>
  )
}
