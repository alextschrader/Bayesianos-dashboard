import { useState, useEffect, useMemo } from 'react'
import Header          from './components/Header'
import MetricsRow      from './components/MetricsRow'
import EquityCurve     from './components/EquityCurve'
import SignalLog       from './components/SignalLog'
import PositionsTable  from './components/PositionsTable'
import PosteriorBeliefs from './components/PosteriorBeliefs'
import InfoBar         from './components/InfoBar'
import PositionModal   from './components/PositionModal'
import BeliefModal     from './components/BeliefModal'
import EventModal      from './components/EventModal'
import { useLivePrices }  from './hooks/useLivePrices'
import { useEventStream } from './hooks/useEventStream'
import { useLiveBeliefs } from './hooks/useLiveBeliefs'

export default function App() {
  const [data,  setData]  = useState(null)
  const [error, setError] = useState(false)
  const [modal, setModal] = useState(null)   // { type, data, ... }

  useEffect(() => {
    fetch('/data.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData)
      .catch(() => setError(true))
  }, [])

  // ── Part 1: live prices ──────────────────────────────────────────────────
  const livePositions = useLivePrices(data?.positions)

  const liveMetrics = useMemo(() => {
    if (!data || !livePositions.length) return data?.metrics
    const initAvg = data.positions.reduce((s, p) => s + p.pnl, 0) / data.positions.length
    const liveAvg = livePositions.reduce((s, p) => s + p.pnl, 0) / livePositions.length
    const drift   = (liveAvg - initAvg) * 0.55
    return { ...data.metrics, pnl_1d: Math.round((data.metrics.pnl_1d + drift) * 100) / 100 }
  }, [data, livePositions])

  // ── Part 2: live event stream ────────────────────────────────────────────
  const { events, elapsed, lastUpdate } = useEventStream(data?.signal_log)

  // ── Part 3: beliefs react to events ─────────────────────────────────────
  const liveBeliefs = useLiveBeliefs(data?.posterior_beliefs, events)

  // ── Part 4: modal open callbacks ─────────────────────────────────────────
  const openPosition = pos  => setModal({ type: 'position', data: pos })
  const openBelief   = (b, i) => setModal({ type: 'belief',   data: b, index: i })
  const openEvent    = ev  => setModal({ type: 'event',    data: ev })
  const closeModal   = ()  => setModal(null)

  if (error) return (
    <div className="app" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text-faint)' }}>
      erro ao carregar data.json — rode: python generate_data.py
    </div>
  )
  if (!data) return (
    <div className="app" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text-faint)' }}>
      loading...
    </div>
  )

  return (
    <>
      <div className="app">
        <Header meta={data.meta} />
        <MetricsRow metrics={liveMetrics} />
        <section className="grid">
          <EquityCurve equityCurve={data.equity_curve} />
          <SignalLog events={events} elapsed={elapsed} lastUpdate={lastUpdate} onEventClick={openEvent} />
        </section>
        <section className="grid">
          <PositionsTable livePositions={livePositions} onRowClick={openPosition} />
          <PosteriorBeliefs beliefs={liveBeliefs} updatedAt={data.meta.generated_at} onBeliefClick={openBelief} />
        </section>
        <InfoBar />
      </div>

      {/* ── Modals ── */}
      {modal?.type === 'position' && (
        <PositionModal pos={modal.data} onClose={closeModal} />
      )}
      {modal?.type === 'belief' && (
        <BeliefModal belief={modal.data} onClose={closeModal} />
      )}
      {modal?.type === 'event' && (
        <EventModal event={modal.data} liveBeliefs={liveBeliefs} onClose={closeModal} />
      )}
    </>
  )
}
