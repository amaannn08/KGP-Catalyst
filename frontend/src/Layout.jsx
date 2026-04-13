import { NavLink, useLocation, Navigate } from 'react-router-dom'
import { MessageSquare, LayoutDashboard, Leaf, User } from 'lucide-react'
import ChatApp from './ChatApp.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

// Mock user identity — Wing Leader chip
const USER_IDENTITY = { hall: 'Radhakrishnan Hall', block: '', wing: '', role: 'Hall President' }

export default function Layout() {
  const loc = useLocation()

  return (
    <div className="flex flex-col min-h-dvh h-dvh" style={{ background: '#020a04' }}>

      {/* ── Top Navigation Bar ─────────────────────── */}
      <nav
        className="flex items-center gap-4 px-4 h-12 flex-shrink-0 z-50"
        style={{ background: '#060f08', borderBottom: '1px solid rgba(34,197,94,0.1)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 mr-4">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 2px 8px rgba(22,163,74,0.4)' }}
          >
            <Leaf size={11} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">KGP-Catalyst</span>
          <span className="text-[9px] text-emerald-700 font-medium hidden sm:block">· EcoBuddy AI</span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all tap-none ${
                isActive
                  ? 'text-emerald-300'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' } : { border: '1px solid transparent' }}
          >
            <MessageSquare size={13} />
            Chat
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all tap-none ${
                isActive
                  ? 'text-emerald-300'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' } : { border: '1px solid transparent' }}
          >
            <LayoutDashboard size={13} />
            Dashboard
          </NavLink>
        </div>

        {/* Right: Identity & Live indicator */}
        <div className="ml-auto flex items-center gap-3">
          {/* Identity Chip */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md" style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)' }}>
            <User size={12} className="text-emerald-500" />
            <span className="text-[10px] font-semibold text-emerald-100">{USER_IDENTITY.hall}</span>
            <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-sm font-bold text-emerald-900 bg-emerald-400">
              {USER_IDENTITY.role}
            </span>
          </div>

          <div className="w-px h-4 bg-gray-800 hidden md:block"></div>

          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] text-emerald-700 font-medium hidden sm:block">Campus Sensors Live</span>
          </div>
        </div>
      </nav>

      {/* ── Page content (Cached/CSS Display) ──────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div style={{ display: loc.pathname === '/' ? 'block' : 'none', height: '100%', width: '100%' }}>
          <ChatApp />
        </div>
        <div style={{ display: loc.pathname === '/dashboard' ? 'block' : 'none', height: '100%', width: '100%' }}>
          <DashboardPage />
        </div>
        {/* Wildcard redirect back to chat if unknown route */}
        {loc.pathname !== '/' && loc.pathname !== '/dashboard' && <Navigate to="/" replace />}
      </div>
    </div>
  )
}
