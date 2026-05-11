import { useEffect, useMemo } from 'react'
import { LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine, XAxis } from 'recharts'
import { generateBeliefHistory } from '../utils/generateHistory'

const TT_STYLE = {
  background: '#11151c',
  border: '1px solid #2a3340',
  padding: '5px 10px',
  fontSize: 10,
  fontFamily: 'JetBrains Mono, monospace',
  color: '#e8ecf2',
}

export default function BeliefModal({ belief, onClose }) {
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const history = useMemo(() => generateBeliefHistory(belief), [belief.label, belief.value])

  const values = history.map(p => p.value)
  const min    = Math.min(...values)
  const max    = Math.max(...values)
  const avg    = +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
  const trend  = values[values.length - 1] > values[0]

  // X-axis: show first, middle, last label
  const tickIndices = new Set([0, Math.floor(history.length / 2), history.length - 1])
  const ticks = history.filter((_, i) => tickIndices.has(i)).map(p => p.date)

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-center-wrap">
        <div className="modal-box">

          <div className="modal-header">
            <div>
              <div className="modal-title">{belief.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 3 }}>
                últimos 30 dias
              </div>
            </div>
            <div className="modal-close" onClick={onClose}>✕</div>
          </div>

          <div className="modal-section">
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <ReferenceLine y={0.5} stroke="#4a5468" strokeDasharray="2 4" strokeWidth={1} />
                <XAxis
                  dataKey="date"
                  ticks={ticks}
                  tick={{ fill: '#4a5468', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length
                      ? <div style={TT_STYLE}>
                          <div style={{ color: '#4a5468', fontSize: 9, marginBottom: 3 }}>{label}</div>
                          <div>{payload[0].value.toFixed(2)}</div>
                        </div>
                      : null
                  }
                  cursor={{ stroke: '#2a3340', strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#d4a574"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: '#d4a574', strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="modal-section" style={{ display: 'flex', gap: 0 }}>
            {[
              { label: 'Mínimo', value: min.toFixed(2) },
              { label: 'Médio',  value: avg.toFixed(2) },
              { label: 'Máximo', value: max.toFixed(2) },
              { label: 'Atual',  value: belief.value.toFixed(2), accent: true },
              { label: 'Tendência', value: trend ? '▲ alta' : '▼ baixa', color: trend ? 'var(--green)' : 'var(--red)' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1 }}>
                <div className="modal-stat-label">{s.label}</div>
                <div
                  className="modal-stat-value"
                  style={{
                    fontSize: 13,
                    color: s.color ?? (s.accent ? 'var(--accent)' : 'var(--text)'),
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 20px', fontSize: 10, color: 'var(--text-dim)', borderTop: '1px solid var(--border)' }}>
            {belief.note}
          </div>

        </div>
      </div>
    </div>
  )
}
