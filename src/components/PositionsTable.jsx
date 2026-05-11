import { useLivePrices } from '../hooks/useLivePrices'

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

export default function PositionsTable({ livePositions, onRowClick }) {
  const rows = livePositions ?? []

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          Posições Abertas <span className="accent">// {rows.length} ativas</span>
        </div>
        <div className="panel-actions">
          <span>export</span>
          <span className="active">live</span>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Side</th>
            <th className="right">Entry</th>
            <th className="right">Last</th>
            <th className="right">P&amp;L</th>
            <th className="right">Held</th>
            <th className="right">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr
              key={p.ticker}
              onClick={() => onRowClick?.(p)}
              style={{ cursor: 'pointer' }}
            >
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
    </div>
  )
}
