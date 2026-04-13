import { motion as Motion, AnimatePresence } from 'framer-motion'
import { Cpu, Brain, BarChart2, MessageSquare, Radio } from 'lucide-react'

const STAGES = [
  { id: 'sensor',    icon: Radio,         label: 'Sensor Stream',     color: '#fbbf24', desc: 'Smart meters & flowmeters' },
  { id: 'detect',    icon: BarChart2,     label: 'Detection Agent',   color: '#fb923c', desc: 'Anomaly + deviation scan' },
  { id: 'compare',   icon: Cpu,           label: 'Comparison Agent',  color: '#a78bfa', desc: 'Campus-wide context' },
  { id: 'retrieve',  icon: Brain,         label: 'Retrieval Agent',   color: '#38bdf8', desc: 'Vector RAG + time-series' },
  { id: 'narrative', icon: MessageSquare, label: 'Narrative Agent',   color: '#34d399', desc: 'Identity-driven output' },
]

export default function DataPipeline({ isActive }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-500">Agentic RAG Pipeline</span>
        <AnimatePresence>
          {isActive && (
            <Motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-bold text-emerald-300"
              style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}
            >
              PROCESSING
            </Motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Vertical pipeline */}
      <div className="relative">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon
          const delay = i * 0.15
          return (
            <div key={stage.id} className="flex items-start gap-2 relative">
              {/* Connector line */}
              {i < STAGES.length - 1 && (
                <div className="absolute left-3.5 top-7 bottom-0 w-px z-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  {isActive && (
                    <Motion.div
                      initial={{ scaleY: 0, originY: 0 }}
                      animate={{ scaleY: [0, 1, 1, 0], originY: 0 }}
                      transition={{ delay, duration: 1.2, repeat: Infinity, repeatDelay: 0.5 }}
                      className="absolute inset-0 rounded-full"
                      style={{ background: `linear-gradient(to bottom, ${stage.color}, transparent)` }}
                    />
                  )}
                </div>
              )}

              {/* Icon node */}
              <div
                className="relative z-10 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300"
                style={{
                  background: isActive ? `rgba(${hexToRgb(stage.color)}, 0.15)` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? stage.color + '44' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: isActive ? `0 0 8px ${stage.color}33` : 'none',
                }}
              >
                <AnimatePresence>
                  {isActive && (
                    <Motion.div
                      key="pulse"
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay, duration: 0.8, repeat: Infinity }}
                      className="absolute inset-0 rounded-lg"
                      style={{ background: stage.color }}
                    />
                  )}
                </AnimatePresence>
                <Icon size={11} style={{ color: isActive ? stage.color : '#4b5563' }} />
              </div>

              {/* Label */}
              <div className="flex-1 pb-4 pt-0.5">
                <p className="text-[10px] font-semibold" style={{ color: isActive ? stage.color : '#6b7280' }}>
                  {stage.label}
                </p>
                <p className="text-[9px] text-gray-600">{stage.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Objective function */}
      <div className="mt-1 rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[8px] text-gray-600 font-mono text-center">
          ℒ = α·<span style={{ color: '#fbbf24' }}>U</span>{' '}
          + β·<span style={{ color: '#f87171' }}>C</span>{' '}
          + γ·<span style={{ color: '#a78bfa' }}>I</span>
        </p>
        <p className="text-[8px] text-gray-700 text-center mt-0.5">
          Urgency · Conservation · Identity
        </p>
      </div>
    </div>
  )
}

// Helper: hex to rgb for rgba()
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '255,255,255'
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
}
