import PanelInfo from './PanelInfo'

function ElapsedBadge({ elapsed, lastUpdate }) {
  if (!lastUpdate) return null
  const label = elapsed < 60   ? `há ${elapsed}s`
              : elapsed < 3600 ? `há ${Math.floor(elapsed / 60)}m`
              : `há ${Math.floor(elapsed / 3600)}h`
  return (
    <span style={{ color:'var(--text-faint)', borderColor:'transparent', cursor:'default', fontSize:9, letterSpacing:'0.12em' }}>
      {label}
    </span>
  )
}

const TYPE_EXPLAIN = {
  bayes:   'Recalibra P(retorno+) do ativo via likelihood-ratio. Afeta sizing via Kelly.',
  release: 'LLM processa o documento e extrai sentiment score. Entra como evidência no prior setorial.',
  macro:   'Revisão de expectativa macro. Atualiza P(regime=risk_on) do portfólio.',
  copom:   'Tom do BCB extraído por LLM. Atualiza P(Hawkish) da política monetária.',
}

export default function SignalLog({ events, elapsed, lastUpdate, onEventClick }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          Evidence Stream
          <PanelInfo>
            Feed de evidências em tempo real que alimentam o modelo bayesiano. Cada evento
            atualiza as crenças via regra de Bayes: <strong>P(H|E) ∝ P(E|H) × P(H)</strong>.
            Eventos <em>macro</em> e <em>copom</em> afetam beliefs de regime;
            <em> release</em> e <em>bayes</em> afetam posteriors individuais de ativo.
            Clique em qualquer evento para ver o impacto no modelo.
          </PanelInfo>
        </div>
        <div className="panel-actions">
          <span className="active">all</span>
          <span>signals</span>
          <span className="live-badge">LIVE</span>
          <ElapsedBadge elapsed={elapsed} lastUpdate={lastUpdate} />
        </div>
      </div>
      <div className="panel-body">
        <div className="log">
          {(events ?? []).map(s => (
            <div
              key={s.id}
              className={`log-entry${s.isNew ? ' log-entry-new' : ''} log-entry-clickable`}
              onClick={() => onEventClick?.(s)}
              title={TYPE_EXPLAIN[s.type] ?? ''}
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
