import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare, Plus, Leaf } from 'lucide-react'

export default function Sidebar({ sessions, activeId, onNew, onSelect, isOpen }) {
  return (
    <div
      className="flex flex-col bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-hidden transition-all duration-300"
      style={{ width: isOpen ? 260 : 0, minWidth: isOpen ? 260 : 0 }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-800">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)' }}>
          <Leaf size={13} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-100 whitespace-nowrap">KGP Catalyst</span>
      </div>

      {/* New Chat */}
      <div className="px-3 py-3">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors whitespace-nowrap"
        >
          <Plus size={15} strokeWidth={2.5} />
          New conversation
        </button>
      </div>

      {/* Conversation list */}
      <div className="px-2 pb-1">
        {sessions.length > 0 && (
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
            Recents
          </p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
        <AnimatePresence initial={false}>
          {sessions.map(s => {
            const active = s.id === activeId
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onSelect(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-gray-800 text-slate-100 border border-gray-700'
                    : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 border border-transparent'
                }`}
              >
                <MessageSquare size={13} className="flex-shrink-0 opacity-60" />
                <span className="truncate flex-1">{s.title}</span>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800">
        <p className="text-[11px] text-gray-600 whitespace-nowrap">Gemini Embeddings · DeepSeek Chat</p>
      </div>
    </div>
  )
}
