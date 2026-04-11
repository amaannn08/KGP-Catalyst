import { Sparkles } from 'lucide-react'

export default function ThinkingBubble() {
  return (
    <div className="flex gap-3 items-start msg-in">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{ background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', boxShadow: '0 2px 10px rgba(59,130,246,0.4)' }}>
        <Sparkles size={11} className="text-white" />
      </div>
      <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl rounded-tl-sm bg-gray-900 border border-gray-800">
        <span className="text-xs text-gray-600 mr-1">Thinking</span>
        <span className="thinking-dot" />
        <span className="thinking-dot" />
        <span className="thinking-dot" />
      </div>
    </div>
  )
}
