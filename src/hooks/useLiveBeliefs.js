import { useState, useEffect, useRef } from 'react'

function inferDelta(event) {
  const mag = +(0.03 + Math.random() * 0.05).toFixed(2)
  if (event.type === 'macro') {
    const up   = /\+\d+pp/.test(event.detail)
    const down = /-\d+pp/.test(event.detail)
    return (up ? true : down ? false : Math.random() > 0.45) ? mag : -mag
  }
  if (event.type === 'copom') return /hawkish/i.test(event.headline) ? mag : -mag
  return Math.random() > 0.5 ? mag : -mag
}

function clamp(v) { return Math.max(0.05, Math.min(0.96, v)) }

const TRIGGER = { macro: 0, copom: 1 }
const ARROW_TTL = 4_000

export function useLiveBeliefs(initialBeliefs, events) {
  // FIX: start empty — populated when data arrives
  const [beliefs, setBeliefs] = useState([])

  const seenId  = useRef(null)
  const seeded  = useRef(false)
  const timers  = useRef([])

  // FIX: initialize from JSON as soon as data loads
  useEffect(() => {
    if (!initialBeliefs?.length || seeded.current) return
    seeded.current = true
    setBeliefs(initialBeliefs.map(b => ({ ...b, delta: null, changed: false })))
  }, [initialBeliefs])

  // react to incoming events
  useEffect(() => {
    const latest = events?.[0]
    if (!latest?.isNew)               return
    if (latest.id === seenId.current) return
    seenId.current = latest.id

    const targetIdx = TRIGGER[latest.type]
    if (targetIdx == null) return

    const delta = inferDelta(latest)

    setBeliefs(prev => prev.map((b, i) => {
      if (i !== targetIdx) return b
      return { ...b, value: clamp(+(b.value + delta).toFixed(2)), delta, changed: true }
    }))

    const t = setTimeout(() => {
      setBeliefs(prev => prev.map((b, i) =>
        i === targetIdx ? { ...b, delta: null, changed: false } : b
      ))
    }, ARROW_TTL)
    timers.current.push(t)
  }, [events])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  return beliefs
}
