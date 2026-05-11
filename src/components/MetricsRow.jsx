import { useState } from 'react'

function fmt(v, dec = 1) { return v != null ? v.toFixed(dec) : '--' }

// ── Tooltip content per metric ────────────────────────────────────────────────
const TIPS = {
  pnl: {
    label: 'P&L Acumulado',
    body:  'Retorno total do portfólio desde 1 Jan 2026, net de custos de transação. Consolida P&L realizado e não realizado das 14 posições.',
  },
  sharpe: {
    label: 'Sharpe (12m)',
    body:  'Retorno anualizado ÷ volatilidade anualizada nos últimos 12 meses. Fórmula: (R_p − R_f) / σ_p × √252. Sharpe do IBOV usado como benchmark.',
  },
  drawdown: {
    label: 'Max Drawdown',
    body:  'Maior queda contínua de pico a vale na curva de equity YTD. Mede o pior cenário histórico sofrido — indicador de risco de cauda.',
  },
  beta: {
    label: 'Beta IBOV',
    body:  'Sensibilidade do retorno do portfólio ao movimento do IBOV. Beta 0.31 indica estratégia quasi market-neutral. Alvo do modelo: β < 0.40.',
  },
  positions: {
    label: 'Posições Ativas',
    body:  '7 long + 7 short. Cada posição dimensionada via Kelly Criterion bayesiano: f* = (p·b − q) / b, onde p = P(retorno+) do modelo.',
  },
  turnover: {
    label: 'Turnover Mensal',
    body:  'Percentual médio do portfólio rotacionado por mês. 38% = giro moderado. Custo estimado de 0.18%/mês em spreads + corretagem.',
  },
}

// ── Animated daily P&L delta ──────────────────────────────────────────────────
function PnlDelta({ value }) {
  const dir   = value >= 0 ? 'up' : 'down'
  const arrow = value >= 0 ? '▲'  : '▼'
  const sign  = value >= 0 ? '+'  : ''
  return (
    <div className="metric-delta">
      <span className={`arrow ${dir}`}>{arrow}</span>{' '}
      <span key={value} className={`flash-${dir}`} style={{ display: 'inline' }}>
        {sign}{fmt(value, 2)}% (1d)
      </span>
    </div>
  )
}

// ── Single metric card with tooltip ──────────────────────────────────────────
function MetricCard({ tipKey, alignRight, valueNode, deltaNode }) {
  const [show, setShow] = useState(false)
  const tip = TIPS[tipKey]

  return (
    <div
      className="metric"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className="metric-label">{tip.label}</div>
      {valueNode}
      {deltaNode}

      {show && (
        <div className={`metric-tip${alignRight ? ' tip-right' : ''}`}>
          <div className="metric-tip-label">{tip.label}</div>
          {tip.body}
        </div>
      )}
    </div>
  )
}

// ── Metrics row ───────────────────────────────────────────────────────────────
export default function MetricsRow({ metrics: m }) {
  if (!m) return null
  const pnlPos = m.pnl_acumulado >= 0
  const ddNeg  = m.max_drawdown  <  0

  return (
    <section className="metrics-row">
      <MetricCard tipKey="pnl"
        valueNode={
          <div className={`metric-value ${pnlPos ? 'pos' : 'neg'}`}>
            {pnlPos ? '+' : ''}{fmt(m.pnl_acumulado)}%
          </div>
        }
        deltaNode={<PnlDelta value={m.pnl_1d} />}
      />

      <MetricCard tipKey="sharpe"
        valueNode={<div className="metric-value">{fmt(m.sharpe_12m, 2)}</div>}
        deltaNode={<div className="metric-delta">vs. IBOV: {fmt(m.sharpe_ibov, 2)}</div>}
      />

      <MetricCard tipKey="drawdown"
        valueNode={
          <div className={`metric-value ${ddNeg ? 'neg' : 'pos'}`}>
            {fmt(m.max_drawdown)}%
          </div>
        }
        deltaNode={<div className="metric-delta">recovered {m.recovery_days}d</div>}
      />

      <MetricCard tipKey="beta"
        valueNode={<div className="metric-value">{fmt(m.beta_ibov, 2)}</div>}
        deltaNode={<div className="metric-delta">market-neutral target</div>}
      />

      <MetricCard tipKey="positions" alignRight
        valueNode={<div className="metric-value">{m.posicoes_ativas}</div>}
        deltaNode={<div className="metric-delta">{m.long_count} long / {m.short_count} short</div>}
      />

      <MetricCard tipKey="turnover" alignRight
        valueNode={<div className="metric-value">{m.turnover_mensal}%</div>}
        deltaNode={<div className="metric-delta">custos: {fmt(m.custo_pct, 2)}%</div>}
      />
    </section>
  )
}
