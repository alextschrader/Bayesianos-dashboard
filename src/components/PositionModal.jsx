import { useEffect, useMemo } from 'react'
import {
  AreaChart, Area, LineChart, Line,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { generatePriceHistory, generateConfidenceHistory, getEntrySignal } from '../utils/generateHistory'

const TT_STYLE = {
  background: '#11151c',
  border: '1px solid #2a3340',
  padding: '5px 10px',
  fontSize: 10,
  fontFamily: 'JetBrains Mono, monospace',
  color: '#e8ecf2',
}

function MiniTooltip({ active, payload, suffix = '' }) {
  if (!active || !payload?.length) return null
  return <div style={TT_STYLE}>{payload[0].value.toFixed(2)}{suffix}</div>
}

export default function PositionModal({ pos, onClose }) {
  // ESC to close
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const priceData = useMemo(() => generatePriceHistory(pos), [pos.ticker])
  const confData  = useMemo(() => generateConfidenceHistory(pos), [pos.ticker])
  const signal    = useMemo(() => getEntrySignal(pos), [pos.ticker])

  const pnlPos  = pos.pnl >= 0
  const pnlSign = pos.pnl >= 0 ? '+' : ''

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-side">

        {/* ── Header ── */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
              {pos.ticker}
            </div>
            <span className={`side ${pos.side.toLowerCase()}`}>{pos.side}</span>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, color: pnlPos ? 'var(--green)' : 'var(--red)' }}>
              {pnlSign}{pos.pnl.toFixed(2)}%
            </div>
          </div>
          <div className="modal-close" onClick={onClose}>✕</div>
        </div>

        {/* ── Price stats ── */}
        <div className="modal-section">
          <div className="modal-stat-row">
            <div className="modal-stat">
              <div className="modal-stat-label">Entry</div>
              <div className="modal-stat-value">{pos.entry.toFixed(2)}</div>
            </div>
            <div className="modal-stat">
              <div className="modal-stat-label">Last</div>
              <div className="modal-stat-value" style={{ color: pnlPos ? 'var(--green)' : 'var(--red)' }}>
                {pos.last.toFixed(2)}
              </div>
            </div>
            <div className="modal-stat">
              <div className="modal-stat-label">Held</div>
              <div className="modal-stat-value">{pos.held}</div>
            </div>
            <div className="modal-stat">
              <div className="modal-stat-label">Confidence</div>
              <div className="modal-stat-value">{pos.confidence.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* ── Price history chart ── */}
        <div className="modal-section">
          <div className="modal-section-label">Histórico de Preço</div>
          <ResponsiveContainer width="100%" height={110}>
            <AreaChart data={priceData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="modalPriceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#d4a574" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#d4a574" stopOpacity={0} />
                </linearGradient>
              </defs>
              <ReferenceLine y={pos.entry} stroke="#4a5468" strokeDasharray="2 4" strokeWidth={1} />
              <Tooltip
                content={({ active, payload }) => <MiniTooltip active={active} payload={payload} />}
                cursor={{ stroke: '#2a3340', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#d4a574"
                strokeWidth={1.5}
                fill="url(#modalPriceGrad)"
                dot={false}
                activeDot={{ r: 3, fill: '#d4a574', strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-faint)', marginTop: 6, letterSpacing: '0.1em' }}>
            <span>entrada</span>
            <span>agora</span>
          </div>
        </div>

        {/* ── Entry signal ── */}
        <div className="modal-section">
          <div className="modal-section-label">Razão da Entrada</div>
          <div className="modal-entry-tag">{signal.tag}</div>
          <div className="modal-entry-text">{signal.text}</div>
          <div className="modal-entry-driver">{signal.driver}</div>
        </div>

        {/* ── Confidence history ── */}
        <div className="modal-section">
          <div className="modal-section-label">Confiança ao Longo do Tempo</div>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={confData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <ReferenceLine y={0.5} stroke="#4a5468" strokeDasharray="2 4" strokeWidth={1} />
              <Tooltip
                content={({ active, payload }) => <MiniTooltip active={active} payload={payload} />}
                cursor={{ stroke: '#2a3340', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="conf"
                stroke="#60a5fa"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: '#60a5fa', strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-faint)', marginTop: 6, letterSpacing: '0.1em' }}>
            <span>entrada</span>
            <span>conf atual: {pos.confidence.toFixed(2)}</span>
          </div>
        </div>

      </div>
    </div>
  )
}
