import { useState } from 'react'
import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import PanelInfo from './PanelInfo'

const PERIODS = ['1M', '3M', 'YTD', '1Y', 'ALL']

function fmt(v) {
  if (v == null) return '--'
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const robot = payload.find(p => p.dataKey === 'robot')
  const ibov  = payload.find(p => p.dataKey === 'ibov')
  const spread = robot && ibov ? robot.value - ibov.value : null
  return (
    <div style={{ background:'#11151c', border:'1px solid #2a3340', padding:'10px 14px', fontSize:10, fontFamily:'JetBrains Mono, monospace', lineHeight:1.6 }}>
      <div style={{ color:'#4a5468', fontSize:9, letterSpacing:'0.1em', marginBottom:6 }}>{label}</div>
      {robot && (
        <div style={{ display:'flex', justifyContent:'space-between', gap:20, color:'#d4a574' }}>
          <span>Robô</span>
          <span style={{ fontFamily:'Fraunces, serif' }}>{fmt(robot.value)}</span>
        </div>
      )}
      {ibov && (
        <div style={{ display:'flex', justifyContent:'space-between', gap:20, color:'#8590a4', marginTop:2 }}>
          <span>IBOV</span>
          <span style={{ fontFamily:'Fraunces, serif' }}>{fmt(ibov.value)}</span>
        </div>
      )}
      {spread != null && (
        <div style={{ display:'flex', justifyContent:'space-between', gap:20, color: spread >= 0 ? '#4ade80' : '#f87171', marginTop:4, borderTop:'1px solid #1f2632', paddingTop:4, fontSize:9 }}>
          <span>spread</span>
          <span style={{ fontFamily:'Fraunces, serif' }}>{fmt(spread)}</span>
        </div>
      )}
    </div>
  )
}

function LastDot({ cx, cy }) {
  if (cx == null || cy == null) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={9} fill="#d4a574" fillOpacity={0.25} />
      <circle cx={cx} cy={cy} r={4} fill="#d4a574" />
    </g>
  )
}

export default function EquityCurve({ equityCurve }) {
  const [period, setPeriod] = useState('YTD')
  const data = equityCurve?.[period] ?? []

  const allVals = data.length > 0
    ? [...data.map(d => d.robot), ...data.map(d => d.ibov), 0]
    : [0]
  const rawMin = Math.min(...allVals)
  const rawMax = Math.max(...allVals)
  const yMin   = Math.floor((rawMin - 4) / 5) * 5
  const yMax   = Math.ceil((rawMax  + 4) / 5) * 5

  const ticks = []
  for (let t = yMin; t <= yMax; t += 10) ticks.push(t)

  const lastPoint = data[data.length - 1]

  const renderLastDot = props =>
    props.index !== data.length - 1
      ? <g key={`skip-${props.index}`} />
      : <LastDot key="last" cx={props.cx} cy={props.cy} />

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          Equity Curve
          <span className="accent"> // Posterior-Weighted</span>
          <PanelInfo>
            Retorno acumulado do portfólio ponderado pela confiança posterior do modelo.
            Dias com maior certeza (P(retorno+) &gt; 0.70) têm sizing maior via Kelly Criterion.
            A linha tracejada é o IBOV como benchmark. O spread (Robô − IBOV) aparece no
            tooltip ao passar o mouse. Toggle de período no canto direito.
          </PanelInfo>
        </div>
        <div className="panel-actions">
          {PERIODS.map(p => (
            <span key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="panel-body">
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={336}>
            <ComposedChart data={data} margin={{ top:6, right:10, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#d4a574" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#d4a574" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f2632" strokeOpacity={0.6} vertical={false} />
              <ReferenceLine y={0} stroke="#4a5468" strokeDasharray="2 4" strokeWidth={1} />
              <XAxis dataKey="date" tick={{ fill:'#4a5468', fontSize:9, fontFamily:'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={40} />
              <YAxis ticks={ticks} tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`} tick={{ fill:'#4a5468', fontSize:9, fontFamily:'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} domain={[yMin, yMax]} width={50} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke:'#2a3340', strokeWidth:1 }} />
              <Line type="monotone" dataKey="ibov" stroke="#4a5468" strokeWidth={1.5} strokeDasharray="3 3" dot={false} activeDot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="robot" stroke="#d4a574" strokeWidth={2} fill="url(#equityGrad)" dot={renderLastDot} activeDot={{ r:4, fill:'#d4a574', strokeWidth:0 }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="divider-h" />

        <div style={{ display:'flex', gap:24, fontSize:10, color:'var(--text-dim)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:14, height:2, background:'var(--accent)' }} />
            Robô Bayesianos · {lastPoint ? fmt(lastPoint.robot) : '--'} {period}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:14, height:1, background:'var(--text-faint)', borderTop:'1px dashed var(--text-faint)' }} />
            IBOV benchmark · {lastPoint ? fmt(lastPoint.ibov) : '--'} {period}
          </div>
          {lastPoint && (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:14, height:2, background: lastPoint.robot - lastPoint.ibov >= 0 ? 'var(--green)' : 'var(--red)' }} />
              spread · {fmt(lastPoint.robot - lastPoint.ibov)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
