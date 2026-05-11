function ElapsedBadge({ elapsed, lastUpdate }) {
  if (!lastUpdate) return null
  const label = elapsed < 60
    ? `há ${elapsed}s`
    : elapsed < 3600
      ? `há ${Math.floor(elapsed / 60)}m`
      : `há ${Math.floor(elapsed / 3600)}h`
  return (
    <span style={{
      color: 'var(--text-faint)', borderColor: 'transparent',
      cursor: 'default', fontSize: 9, letterSpacing: '0.12em', padding: '2px 0',
    }}>
      {label}
    </span>
  )
}

export default function SignalLog({ events, elapsed, lastUpdate, onEventClick }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Evidence Stream</div>
        <div className="panel-actions">
          <span className="active">all</span>
          <span>signals</span>
          <ElapsedBadge elapsed={elapsed} lastUpdate={lastUpdate} />
        </div>
      </div>
      <div className="panel-body">
        <div className="log">
          {(events ?? []).map((s) => (
            <div
              key={s.id}
              className={`log-entry${s.isNew ? ' log-entry-new' : ''}`}
              onClick={() => onEventClick?.(s)}
              style={{ cursor: 'pointer' }}
            >
              <div className="log-time">{s.time}</div>
              <div className="log-content">
                <div className="log-headline">
                  <span className={`log-tag ${s.type}`}>{s.tag}</span>
                  {s.headline}
                </div>
                <div className="log-detail">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
