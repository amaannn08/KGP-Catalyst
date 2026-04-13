import React from 'react'

import Leaderboard from '../components/Leaderboard.jsx'
import NotificationFeed from '../components/NotificationFeed.jsx'

export default function DashboardPage() {
  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: '#020a04' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Campus Sustainability Command</h1>
          <p className="text-emerald-600 mt-1">Live campus telemetry and environmental awareness</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Leaderboard - takes up 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl overflow-hidden p-4" style={{ background: 'rgba(6,15,8,0.8)', border: '1px solid rgba(34,197,94,0.1)' }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-4 px-2">🏆 Global Rankings</h2>
              <Leaderboard isPipelineActive={false} />
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-6">

            <div className="rounded-xl overflow-hidden p-4" style={{ background: 'rgba(6,15,8,0.8)', border: '1px solid rgba(34,197,94,0.1)' }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-4 px-2">🔔 Live Dispatches</h2>
              <NotificationFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
