import { useState, useEffect } from 'react'

function formatTimestamp(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).replace(',', ' ·') + ' BRT'
}

export default function Header({ meta }) {
  const [now, setNow] = useState(meta?.generated_at ?? '')

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const pad = n => String(n).padStart(2, '0')
      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
      setNow(`${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} BRT`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="header">
      <div className="brand">
        <div className="brand-name">Bayesianos<span className="dot">.</span></div>
        <div className="brand-sub">Quant AI Itaú Asset 2026 — Synthesis Engine {meta?.version ?? 'v0.3'}</div>
      </div>
      <div className="header-meta">
        <div className="status">
          <span className="status-dot" />
          <span>Live · São Paulo</span>
        </div>
        <div className="timestamp">Last update: {now}</div>
      </div>
    </header>
  )
}
