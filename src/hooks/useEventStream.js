import { useState, useEffect, useRef } from 'react'

// ── helpers ───────────────────────────────────────────────────────────────────
const r   = (min, max, dec = 2) => +(Math.random() * (max - min) + min).toFixed(dec)
const pick = arr => arr[Math.floor(Math.random() * arr.length)]
const nowTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const TICKERS = ['PETR4','VALE3','ITUB4','BBDC4','WEGE3','MGLU3','ABEV3','RENT3','RADL3','BPAC11','ELET3','SUZB3']

// ── event factory ─────────────────────────────────────────────────────────────
function makeEvent() {
  const type = pick(['bayes','bayes','bayes','release','macro','macro','copom'])
  const time  = nowTime()
  const id    = Date.now() + Math.random()

  // ── posterior update / rebalance / pair ──
  if (type === 'bayes') {
    const sub = pick(['update','update','rebalance','pair'])

    if (sub === 'update') {
      const t    = pick(TICKERS)
      const from = r(0.44, 0.65)
      const to   = r(0.58, 0.86)
      const dir  = to > from ? 'bullish' : 'bearish'
      return { id, time, type, tag: 'posterior update', isNew: true,
        headline: `${t} belief revised — ${dir}`,
        detail: `P(retorno+) ${from} → ${to} · driver: ${pick(['LLM sentiment','earnings beat','macro revision','pair z-score','vol compression'])}` }
    }

    if (sub === 'rebalance') {
      const n = pick([3,5,7,9])
      return { id, time, type, tag: 'rebalance', isNew: true,
        headline: 'Intraday portfolio rebalance triggered',
        detail: `${n} positions adjusted · turnover ${r(1.2,5.8,1)}% · est. costs ${r(0.006,0.018,3)}%` }
    }

    // pair trade
    const [a,b] = pick([['ITUB4','BBDC4'],['PETR4','CMIG4'],['VALE3','ELET3'],['WEGE3','MGLU3'],['RADL3','LREN3']])
    const z = r(1.8, 2.9)
    return { id, time, type, tag: 'pair trade', isNew: true,
      headline: `${a} / ${b} spread — entry signal`,
      detail: `z-score ${z} · cointegração p < 0.01 · long ${a} / short ${b} opened` }
  }

  // ── release / notícia ──
  if (type === 'release') {
    if (Math.random() > 0.4) {
      const t    = pick(TICKERS)
      const sent = r(-0.3, 0.6)
      const surp = r(-0.25, 0.5)
      return { id, time, type, tag: 'release', isNew: true,
        headline: `${t} earnings published`,
        detail: `LLM sentiment ${sent >= 0 ? '+' : ''}${sent} · surpresa receita ${surp >= 0 ? '+' : ''}${surp} · guidance: ${pick(['manutenção','upgrade','cautious','expansion'])}` }
    }
    return { id, time, type, tag: 'notícia', isNew: true,
      headline: `${pick(['Brazil Journal','Valor Econômico','Broadcast','CVM filing'])} — ${pick(['guidance revision','M&A rumor','buyback announcement','debt refinancing','insider filing'])}`,
      detail: `LLM relevance ${r(0.54,0.93)} · ${pick(['setor financeiro','setor energia','setor consumo','setor utilities'])} · updating sector prior` }
  }

  // ── macro ──
  if (type === 'macro') {
    const sub = pick(['focus','fiscal','fx','activity'])

    if (sub === 'focus') {
      const to   = r(3.8, 4.6, 1)
      const from = +(to + r(-0.3, 0.3, 1)).toFixed(1)
      const pp   = pick(['+2pp','-1pp','+3pp','-2pp'])
      return { id, time, type, tag: 'macro', isNew: true,
        headline: 'Focus — inflação expectation revised',
        detail: `IPCA 2026: ${from} → ${to} · risk-on regime confidence ${pp}` }
    }
    if (sub === 'fiscal') {
      return { id, time, type, tag: 'macro', isNew: true,
        headline: 'Resultado primário — fiscal balance update',
        detail: `R$${r(1.8,9.2)}B · ${pick(['above','in-line','below'])} consensus · macro prior ${pick(['unchanged','+1pp','-1pp','+2pp'])}` }
    }
    if (sub === 'fx') {
      return { id, time, type, tag: 'macro', isNew: true,
        headline: `USD/BRL ${pick(['spike','correction','breakout'])} detected`,
        detail: `FX move ${r(0.3,1.9)}% · IBOV corr −0.${Math.floor(Math.random()*25+55)} · FX regime updated` }
    }
    return { id, time, type, tag: 'macro', isNew: true,
      headline: 'IBC-Br activity proxy — above expectations',
      detail: `${r(0.1,0.9)}% MoM · ${pick(['industry','services','agriculture'])} led · risk-on signal +${Math.floor(Math.random()*4+1)}pp` }
  }

  // ── copom ──
  const hawkish = r(0.54, 0.84)
  const shift   = r(-0.22, 0.22)
  return { id, time, type: 'copom', tag: 'copom', isNew: true,
    headline: `BCB communication — ${hawkish > 0.65 ? 'hawkish' : 'dovish'} signal`,
    detail: `LLM tone shift ${shift >= 0 ? '+' : ''}${shift} vs previous · hawkish probability ${hawkish}` }
}

// ── hook ──────────────────────────────────────────────────────────────────────
const MIN_DELAY = 8_000
const MAX_DELAY = 15_000
const MAX_EVENTS = 15
const NEW_TTL = 1_500   // ms before isNew is cleared

export function useEventStream(initialEvents) {
  const [events, setEvents] = useState(() =>
    (initialEvents ?? []).map((e, i) => ({ ...e, id: i, isNew: false }))
  )
  const [lastUpdate, setLastUpdate] = useState(null)
  const [elapsed, setElapsed]       = useState(0)

  const alive      = useRef(true)
  const timeoutRef = useRef(null)
  const clearRef   = useRef(null)

  // ── event emitter loop ──
  useEffect(() => {
    alive.current = true

    const emit = () => {
      if (!alive.current) return
      const ev = makeEvent()

      setEvents(prev => [ev, ...prev.slice(0, MAX_EVENTS - 1)])
      setLastUpdate(new Date())
      setElapsed(0)

      clearRef.current = setTimeout(() => {
        if (!alive.current) return
        setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, isNew: false } : e))
      }, NEW_TTL)

      const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY)
      timeoutRef.current = setTimeout(emit, delay)
    }

    // first fire after a short warmup so the page feels alive quickly
    timeoutRef.current = setTimeout(emit, 3_000 + Math.random() * 4_000)

    return () => {
      alive.current = false
      clearTimeout(timeoutRef.current)
      clearTimeout(clearRef.current)
    }
  }, [])

  // ── elapsed counter ──
  useEffect(() => {
    if (!lastUpdate) return
    const id = setInterval(() => setElapsed(s => s + 1), 1_000)
    return () => clearInterval(id)
  }, [lastUpdate])

  return { events, elapsed, lastUpdate }
}
