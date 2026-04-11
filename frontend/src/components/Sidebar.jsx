import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare, Plus, Leaf, Trash2 } from 'lucide-react'

export default function Sidebar({ sessions, activeId, onNew, onSelect, onDelete, isOpen }) {
  const [hovered, setHovered]     = useState(null)
  const [deleting, setDeleting]   = useState(null)

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    setDeleting(id)
    try { await onDelete(id) }
    finally { setDeleting(null) }
  }

  return (
    <div
      className="flex flex-col bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-hidden transition-all duration-300"
      style={{ width: isOpen ? 260 : 0, minWidth: isOpen ? 260 : 0 }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-800 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)' }}>
          <Leaf size={13} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-100 whitespace-nowrap">KGP Catalyst</span>
      </div>

      {/* New Chat */}
      <div className="px-3 py-3 flex-shrink-0">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors whitespace-nowrap"
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
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
        <AnimatePresence initial={false}>
          {sessions.map(s => {
            const isActive = s.id === activeId
            const isHover  = hovered === s.id

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="relative"
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <button
                  onClick={() => onSelect(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-slate-100 border border-gray-700'
                      : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 border border-transparent'
                  }`}
                >
                  <MessageSquare size={13} className="flex-shrink-0 opacity-60" />
                  <span className="truncate flex-1 pr-6">{s.title}</span>
                </button>

                {/* Delete button — shows on hover */}
                <AnimatePresence>
                  {isHover && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.1 }}
                      onClick={(e) => handleDelete(e, s.id)}
                      disabled={deleting === s.id}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-950 transition-colors"
                      title="Delete chat"
                    >
                      {deleting === s.id
                        ? <span className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
                        : <Trash2 size={12} />
                      }
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {sessions.length === 0 && (
          <p className="text-center text-xs text-gray-700 pt-8 px-4">
            No conversations yet.<br />Start one above!
          </p>
        )}
      </nav>
    </div>
  )
}
