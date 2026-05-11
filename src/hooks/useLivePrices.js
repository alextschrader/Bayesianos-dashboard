import { useState, useEffect, useRef } from 'react'

const TICK_MS  = 2200   // price update interval
const FLASH_MS = 800    // how long the colour flash lasts

// Sum of 3 uniforms → ~Gaussian without extra deps
function gaussian() {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
}

export function useLivePrices(initialPositions) {
  const [rows, setRows] = useState(() =>
    (initialPositions ?? []).map(p => ({ ...p, flash: null }))
  )
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    if (!initialPositions?.length) return

    const tick = () => {
      if (!alive.current) return

      setRows(prev => prev.map(pos => {
        // ±0.05–0.25 % movement per tick; longs get a hair of positive bias
        const bias = pos.side === 'LONG' ? 0.00008 : -0.00008
        const move = bias + gaussian() * 0.0018
        const newLast = Math.round((pos.last * (1 + move)) * 100) / 100

        const dir = newLast > pos.last ? 'up'
                  : newLast < pos.last ? 'down'
                  : null

        const pnlPct = pos.side === 'LONG'
          ? ((newLast - pos.entry) / pos.entry) * 100
          : ((pos.entry - newLast) / pos.entry) * 100

        return {
          ...pos,
          last: newLast,
          pnl:  Math.round(pnlPct * 100) / 100,
          flash: dir,
        }
      }))

      // Remove flash class after animation
      setTimeout(() => {
        if (!alive.current) return
        setRows(prev => prev.map(p => p.flash ? { ...p, flash: null } : p))
      }, FLASH_MS)
    }

    const id = setInterval(tick, TICK_MS)
    return () => { alive.current = false; clearInterval(id) }
  }, [initialPositions])

  return rows
}
