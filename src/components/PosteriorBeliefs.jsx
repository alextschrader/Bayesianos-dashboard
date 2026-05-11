function formatTime(isoStr) {
  if (!isoStr) return '--'
  const d = new Date(isoStr)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function BeliefRow({ b, index, onClick }) {
  const pct = `${(b.value * 100).toFixed(1)}%`
  return (
    <div
      className="belief"
      onClick={() => onClick?.(b, index)}
      style={{ cursor: 'pointer' }}
      title="Clique para ver histórico"
    >
      <div className="belief-label">{b.label}</div>

      <div className="belief-bar">
        <div className="belief-fill" style={{ width: pct }} />
        <div key={b.value} className={`belief-value${b.changed ? ' belief-value-changed' : ''}`}>
          {b.value.toFixed(2)}
        </div>
        {b.delta !== null && (
          <span key={`${b.value}-arrow`} className={`belief-arrow ${b.delta > 0 ? 'up' : 'down'}`}>
            {b.delta > 0 ? '▲' : '▼'}
          </span>
        )}
      </div>

      <div className="belief-note">
        {b.delta !== null
          ? <><span className={b.delta > 0 ? 'note-up' : 'note-down'}>{b.delta > 0 ? '+' : ''}{b.delta.toFixed(2)}</span>{' · '}{b.note}</>
          : b.note
        }
      </div>
    </div>
  )
}

export default function PosteriorBeliefs({ beliefs, updatedAt, onBeliefClick }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Posterior Beliefs <span className="accent">// regime</span></div>
        <span className="callout">updated {formatTime(updatedAt)}</span>
      </div>
      <div className="panel-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(beliefs ?? []).map((b, i) => (
            <BeliefRow key={i} b={b} index={i} onClick={onBeliefClick} />
          ))}
        </div>
      </div>
    </div>
  )
}
