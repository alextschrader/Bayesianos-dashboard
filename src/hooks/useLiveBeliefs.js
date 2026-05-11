import { useState, useEffect, useRef } from 'react'

// ── direction inference ────────────────────────────────────────────────────────
// Parse the event text to guess whether the belief should move up or down,
// rather than pure random — makes the stream feel causally consistent.
function inferDelta(event) {
  const mag = +(0.03 + Math.random() * 0.05).toFixed(2)   // 0.03 – 0.08

  if (event.type === 'macro') {
    // "+Xpp" → risk-on increases, "-Xpp" → decreases
    const up   = /\+\d+pp/.test(event.detail)
    const down = /-\d+pp/.test(event.detail)
    const positive = up ? true : down ? false : Math.random() > 0.45
    return positive ? mag : -mag
  }

  if (event.type === 'copom') {
    const positive = /hawkish/i.test(event.headline)
    return positive ? mag : -mag
  }

  return Math.random() > 0.5 ? mag : -mag
}

function clamp(v) { return Math.max(0.05, Math.min(0.96, v)) }

// belief index mapping
const TRIGGER = {
  macro:  0,   // Macro Regime · Risk-On
  copom:  1,   // Política Monetária · Hawkish
}

const ARROW_TTL = 4_000   // ms the arrow stays visible

export function useLiveBeliefs(initialBeliefs, events) {
  const [beliefs, setBeliefs] = useState(() =>
    (initialBeliefs ?? []).map(b => ({ ...b, delta: null, changed: false }))
  )

  const seenId  = useRef(null)
  const timers  = useRef([])

  useEffect(() => {
    const latest = events?.[0]
    if (!latest?.isNew)              return
    if (latest.id === seenId.current) return
    seenId.current = latest.id

    const targetIdx = TRIGGER[latest.type]
    if (targetIdx == null) return

    const delta = inferDelta(latest)

    setBeliefs(prev => prev.map((b, i) => {
      if (i !== targetIdx) return b
      return { ...b, value: clamp(+(b.value + delta).toFixed(2)), delta, changed: true }
    }))

    // fade out the arrow after TTL
    const t = setTimeout(() => {
      setBeliefs(prev => prev.map((b, i) =>
        i === targetIdx ? { ...b, delta: null, changed: false } : b
      ))
    }, ARROW_TTL)
    timers.current.push(t)
  }, [events])

  // cleanup on unmount
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  return beliefs
}
