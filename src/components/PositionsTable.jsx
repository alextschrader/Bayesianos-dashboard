import { useState } from 'react'
import PanelInfo from './PanelInfo'

function PriceCell({ value, flash }) {
  return (
    <td className="right">
      <span key={value} className={flash ? `flash-${flash}` : ''}>
        {value.toFixed(2)}
      </span>
    </td>
  )
}

function PnlCell({ pnl, flash }) {
  const cls  = pnl >= 0 ? 'pos' : 'neg'
  const sign = pnl >= 0 ? '+'  : ''
  return (
    <td className={`right ${cls}`}>
      <span key={pnl} className={flash ? `flash-${flash}` : ''}>
        {sign}{pnl.toFixed(2)}%
      </span>
    </td>
  )
}

const SORT_KEYS = { Last: 'last', 'P&L': 'pnl', Confidence: 'confidence', Entry: 'entry' }

function SortTh({ label, sortKey, active, dir, onSort, right }) {
  return (
    <th
      className={right ? 'right' : ''}
      onClick={() => onSort(label)}
      style={{ cursor: SORT_KEYS[label] ? 'pointer' : 'default', userSelect: 'none' }}
    >
      {label}
      {active && <span style={{ marginLeft: 4, color: 'var(--accent)', fontSize: 8 }}>{dir === 'desc' ? '▼' : '▲'}</span>}
    </th>
  )
}

export default function PositionsTable({ livePositions, onRowClick }) {
  const [sortLabel, setSortLabel] = useState(null)
  const [sortDir,   setSortDir]   = useState('desc')
  const [filter,    setFilter]    = useState(null)   // null | 'LONG' | 'SHORT'

  const handleSort = label => {
    const key = SORT_KEYS[label]
    if (!key) return
    if (sortLabel === label) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortLabel(label); setSortDir('desc') }
  }

  const sortKey = SORT_KEYS[sortLabel]

  const rows = [...(livePositions ?? [])]
    .filter(p => !filter || p.side === filter)
    .sort((a, b) => {
      if (!sortKey) return 0
      const mul = sortDir === 'desc' ? -1 : 1
      return typeof a[sortKey] === 'string'
        ? a[sortKey].localeCompare(b[sortKey]) * mul
        : (a[sortKey] - b[sortKey]) * mul
    })

  const longs  = (livePositions ?? []).filter(p => p.side === 'LONG').length
  const shorts = (livePositions ?? []).filter(p => p.side === 'SHORT').length

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          Posições Abertas
          <span className="accent"> // {(livePositions ?? []).length} ativas</span>
          <PanelInfo>
            Posições abertas agora. Cada tamanho calculado via{' '}
            <strong>Kelly Criterion bayesiano</strong>: f* = (p×b − q) / b, onde p = P(retorno+) do
            modelo. Preços oscilam em tempo real. Clique em qualquer linha para ver histórico de
            preço, razão da entrada e evolução da confiança.
          </PanelInfo>
        </div>
        <div className="panel-actions">
          <span className={!filter ? 'active' : ''} onClick={() => setFilter(null)}>all</span>
          <span
            className={filter === 'LONG' ? 'active' : ''}
            onClick={() => setFilter(f => f === 'LONG' ? null : 'LONG')}
            style={{ color: filter === 'LONG' ? undefined : 'var(--green)', borderColor: 'rgba(74,222,128,0.25)' }}
          >
            {longs}L
          </span>
          <span
            className={filter === 'SHORT' ? 'active' : ''}
            onClick={() => setFilter(f => f === 'SHORT' ? null : 'SHORT')}
            style={{ color: filter === 'SHORT' ? undefined : 'var(--red)', borderColor: 'rgba(248,113,113,0.25)' }}
          >
            {shorts}S
          </span>
          <span className="live-badge">LIVE</span>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Side</th>
            {['Entry','Last','P&L','Held','Confidence'].map(h => (
              <SortTh
                key={h}
                label={h}
                sortKey={SORT_KEYS[h]}
                active={sortLabel === h}
                dir={sortDir}
                onSort={handleSort}
                right
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(p => (
            <tr key={p.ticker} onClick={() => onRowClick?.(p)} className="row-clickable">
              <td><span className="ticker">{p.ticker}</span></td>
              <td><span className={`side ${p.side.toLowerCase()}`}>{p.side}</span></td>
              <td className="right">{p.entry.toFixed(2)}</td>
              <PriceCell value={p.last} flash={p.flash} />
              <PnlCell   pnl={p.pnl}   flash={p.flash} />
              <td className="right">{p.held}</td>
              <td className="right">{p.confidence.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && livePositions?.length > 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 11 }}>
          nenhuma posição {filter?.toLowerCase()} ativa
        </div>
      )}
    </div>
  )
}
