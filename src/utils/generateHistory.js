// Deterministic pseudo-random: same ticker → same chart every time modal opens
function seededRand(seed) {
  let s = ((seed ^ 0x1234abcd) | 0) || 1
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0
    return (s >>> 0) / 4294967296
  }
}

function hashStr(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (Math.imul(33, h) ^ str.charCodeAt(i)) | 0
  return h >>> 0
}

function parseHeld(held) {
  if (!held) return 8
  if (held.includes('d')) return Math.max(6, Math.min(20, parseInt(held) + 2))
  return 8
}

// ── Price history: Brownian bridge pinned at entry and last ──────────────────
export function generatePriceHistory(pos) {
  const rand = seededRand(hashStr(pos.ticker + '_price'))
  const n    = parseHeld(pos.held)

  const pts = []
  for (let i = 0; i < n; i++) {
    const t     = i / (n - 1)
    const base  = pos.entry + t * (pos.last - pos.entry)
    const scale = Math.sqrt(t * (1 - t)) * pos.entry * 0.022
    pts.push({ i, price: +(base + (rand() - 0.5) * scale).toFixed(2) })
  }
  pts[0].price     = pos.entry
  pts[n - 1].price = pos.last
  return pts
}

// ── Confidence history: builds toward current confidence ─────────────────────
export function generateConfidenceHistory(pos) {
  const rand  = seededRand(hashStr(pos.ticker + '_conf'))
  const n     = parseHeld(pos.held)
  const start = Math.max(0.35, pos.confidence - 0.14 - rand() * 0.08)

  const pts = []
  for (let i = 0; i < n; i++) {
    const t     = i / (n - 1)
    const base  = start + t * (pos.confidence - start)
    const noise = (rand() - 0.5) * 0.03 * Math.sqrt(t * (1 - t) + 0.02)
    pts.push({ i, conf: +Math.min(0.96, Math.max(0.22, base + noise)).toFixed(2) })
  }
  pts[n - 1].conf = pos.confidence
  return pts
}

// ── Belief sparkline: 30-day drift toward current value ──────────────────────
export function generateBeliefHistory(belief) {
  const rand   = seededRand(hashStr(belief.label + '_hist'))
  const n      = 30
  const target = belief.value
  let   val    = Math.max(0.08, target - rand() * 0.18 - 0.04)

  const REF = new Date('2026-05-10')
  const pts  = []

  for (let i = 0; i < n; i++) {
    const d = new Date(REF)
    d.setDate(d.getDate() - (n - 1 - i))
    const drift = (target - val) * 0.1 + (rand() - 0.48) * 0.018
    val = +Math.min(0.96, Math.max(0.05, val + drift)).toFixed(3)
    pts.push({
      date:  `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth() + 1).padStart(2,'0')}`,
      value: val,
    })
  }
  pts[n - 1].value = target
  return pts
}

// ── Entry signal: deterministic per ticker ────────────────────────────────────
const PAIRS = {
  ITUB4: 'BBDC4', BBDC4: 'ITUB4',
  PETR4: 'CMIG4', CMIG4: 'PETR4',
  VALE3: 'ELET3', ELET3: 'VALE3',
  RADL3: 'LREN3', LREN3: 'RADL3',
}

const LONG_SIGNALS = [
  pos => ({
    tag: 'posterior update',
    text: `P(retorno+) shifted ${(pos.confidence - 0.11).toFixed(2)} → ${pos.confidence.toFixed(2)} — entry threshold crossed`,
    driver: 'earnings beat · LLM sentiment positive · macro risk-on',
  }),
  pos => ({
    tag: 'macro',
    text: `Risk-on regime shift — ${pos.ticker} long exposure added`,
    driver: 'Focus IPCA revision · BCB guidance · risk premium compression',
  }),
  pos => ({
    tag: 'momentum',
    text: `Price breakout above 20d resistance — momentum signal confirmed`,
    driver: `volume anomaly +${(1.4 + hashStr(pos.ticker) % 8 / 10).toFixed(1)}× average · sector inflow`,
  }),
]

const SHORT_SIGNALS = [
  pos => ({
    tag: 'posterior update',
    text: `P(retorno−) reached ${pos.confidence.toFixed(2)} — short entry threshold`,
    driver: 'guidance miss · LLM sentiment negative · valuation stretched',
  }),
  pos => ({
    tag: 'risk-off',
    text: `High-beta short added — sector rotation defensive`,
    driver: 'risk-off regime signal · credit spread widening · vol expansion',
  }),
]

export function getEntrySignal(pos) {
  const partner = PAIRS[pos.ticker]
  if (partner) {
    const z    = (1.8 + (hashStr(pos.ticker) % 11) / 10).toFixed(1)
    const beta = (0.40 + (hashStr(pos.ticker + 'b') % 30) / 100).toFixed(2)
    return {
      tag:    'pair trade',
      text:   `${pos.ticker} / ${partner} spread z-score ${z} — ${pos.side === 'LONG' ? 'long' : 'short'} leg entry`,
      driver: `cointegração β = ${beta} · 24m lookback · Engle-Granger p < 0.01`,
    }
  }
  const pool = pos.side === 'LONG' ? LONG_SIGNALS : SHORT_SIGNALS
  return pool[hashStr(pos.ticker) % pool.length](pos)
}
