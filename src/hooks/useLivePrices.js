import { useState, useEffect, useRef } from 'react'

const TICK_MS  = 2200
const FLASH_MS = 800

function gaussian() {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
}

export function useLivePrices(initialPositions) {
  // FIX: start empty — populated by the effect when data arrives
  const [rows, setRows] = useState([])
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    if (!initialPositions?.length) return

    // FIX: initialize rows as soon as real data arrives
    setRows(initialPositions.map(p => ({ ...p, flash: null })))

    const tick = () => {
      if (!alive.current) return
      setRows(prev => prev.map(pos => {
        const bias = pos.side === 'LONG' ? 0.00008 : -0.00008
        const move = bias + gaussian() * 0.0018
        const newLast = Math.round((pos.last * (1 + move)) * 100) / 100
        const dir = newLast > pos.last ? 'up' : newLast < pos.last ? 'down' : null
        const pnlPct = pos.side === 'LONG'
          ? ((newLast - pos.entry) / pos.entry) * 100
          : ((pos.entry - newLast) / pos.entry) * 100
        return { ...pos, last: newLast, pnl: Math.round(pnlPct * 100) / 100, flash: dir }
      }))

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
