import { useEffect } from 'react'

// Static causal mapping: event type → belief affected
const BELIEF_IMPACT = {
  macro: {
    belief:  'Macro Regime · Risk-On',
    idx:     0,
    desc:    'Eventos macro recalibram o prior de regime via likelihood-ratio update. Surpresas positivas aumentam P(risk-on); negativos decrementam.',
    color:   'var(--blue)',
  },
  copom: {
    belief:  'Política Monetária · Hawkish',
    idx:     1,
    desc:    'Tom do BCB é extraído por LLM e mapeado em likelihood de hawkishness. Comunicação mais dura → P(hawkish) sobe; dovish → cai.',
    color:   '#c084fc',
  },
  bayes: {
    belief:  null,
    desc:    'Posterior updates individuais não alteram beliefs de regime. Recalibram P(retorno+) do ativo específico e redimensionam a posição via Kelly.',
    color:   'var(--accent)',
  },
  release: {
    belief:  null,
    desc:    'Releases alimentam o pipeline de LLM sentiment. O score resultante entra como evidência nas priors de setor, não no regime macro.',
    color:   'var(--yellow)',
  },
  copom_note: null,
}

const TAG_COLOR = {
  macro:   'var(--blue)',
  copom:   '#c084fc',
  bayes:   'var(--accent)',
  release: 'var(--yellow)',
}

export default function EventModal({ event, liveBeliefs, onClose }) {
  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const impact  = BELIEF_IMPACT[event.type] ?? BELIEF_IMPACT.bayes
  const tagColor = TAG_COLOR[event.type] ?? 'var(--text-dim)'

  // If this event type affects a belief, grab current live value
  const affectedBelief = impact.idx != null ? liveBeliefs?.[impact.idx] : null

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-center-wrap">
        <div className="modal-box">

          <div className="modal-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className={`log-tag ${event.type}`} style={{ position: 'static' }}>{event.tag}</span>
                <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{event.time}</span>
              </div>
              <div className="modal-title" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 12, color: 'var(--text)' }}>
                {event.headline}
              </div>
            </div>
            <div className="modal-close" onClick={onClose}>✕</div>
          </div>

          {/* Detail */}
          <div className="modal-section">
            <div className="modal-section-label">Evidência</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              {event.detail}
            </div>
          </div>

          {/* Belief impact */}
          <div className="modal-section">
            <div className="modal-section-label">Impacto no Modelo Bayesiano</div>

            {affectedBelief ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: impact.color, boxShadow: `0 0 6px ${impact.color}`,
                    }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text)' }}>{impact.belief}</div>
                </div>

                {/* Mini belief bar */}
                <div style={{ height: 20, background: 'var(--bg-elev)', border: '1px solid var(--border)', position: 'relative', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${affectedBelief.value * 100}%`,
                    background: `linear-gradient(90deg, var(--accent-dim), var(--accent))`,
                    opacity: 0.4,
                    transition: 'width 0.4s ease',
                  }} />
                  <span style={{ position: 'relative', fontFamily: 'Fraunces, serif', fontSize: 13, zIndex: 1 }}>
                    {affectedBelief.value.toFixed(2)}
                  </span>
                  {affectedBelief.delta != null && (
                    <span style={{
                      position: 'relative', zIndex: 1, marginLeft: 8, fontSize: 9,
                      color: affectedBelief.delta > 0 ? 'var(--green)' : 'var(--red)',
                    }}>
                      {affectedBelief.delta > 0 ? '▲' : '▼'} {affectedBelief.delta > 0 ? '+' : ''}{affectedBelief.delta.toFixed(2)}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5 }}>{impact.desc}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: impact.color, opacity: 0.5 }} />
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Sem impacto em beliefs de regime</div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5 }}>{impact.desc}</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
