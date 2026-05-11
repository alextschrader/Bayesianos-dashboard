import PanelInfo from './PanelInfo'

function formatTime(isoStr) {
  if (!isoStr) return '--'
  const d = new Date(isoStr)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// Bar colour shifts from red → amber → green as belief increases
function barGradient(value) {
  if (value >= 0.70) return 'linear-gradient(90deg,rgba(74,222,128,0.25),rgba(74,222,128,0.55))'
  if (value <= 0.32) return 'linear-gradient(90deg,rgba(248,113,113,0.25),rgba(248,113,113,0.50))'
  return 'linear-gradient(90deg,var(--accent-dim),var(--accent))'
}

const BELIEF_DESC = {
  'Macro Regime · Risk-On':
    'P(mercado em regime expansionista). Acima de 0.5 → portfólio net long / mais agressivo. Abaixo → postura defensiva. Atualizado por dados macro e revisões do Focus.',
  'Política Monetária · Hawkish':
    'P(BCB em ciclo restritivo). Alto → juros sobem, renda fixa shorts atraentes. Baixo → afrouxamento, exposição a crescimento. Atualizado pelo tom das atas do COPOM via LLM.',
  'Setor Consumo · Bullish (3M)':
    'P(setor de consumo supera o IBOV nos próximos 3 meses). Alimentado por atas de resultados, dados de vendas e notícias de reestruturação.',
  'Setor Bancário · Mean-Reverting':
    'P(spread ITUB4/BBDC4 continua cointegrado). Alta probabilidade justifica a estratégia de pair trading no par com janela de 24 meses.',
}

function BeliefRow({ b, index, onClick }) {
  const pct  = `${(b.value * 100).toFixed(1)}%`
  const desc = BELIEF_DESC[b.label]

  return (
    <div className="belief belief-clickable" onClick={() => onClick?.(b, index)} title="Clique para ver histórico 30 dias">
      <div className="belief-label">
        {b.label}
        {desc && (
          <span
            className="belief-info"
            title={desc}
            onClick={e => e.stopPropagation()}
          >i</span>
        )}
      </div>

      <div className="belief-bar">
        <div className="belief-fill" style={{ width: pct, background: barGradient(b.value) }} />
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
        <div className="panel-title">
          Posterior Beliefs
          <span className="accent"> // regime</span>
          <PanelInfo>
            Distribuições de probabilidade sobre estados do mundo mantidas pelo robô.
            Atualizadas via <strong>regra de Bayes</strong>: posterior ∝ likelihood × prior.
            Barras verdes = crença forte (P &gt; 0.70), vermelhas = crença fraca / inversa (P &lt; 0.35).
            Clique em qualquer belief para ver o histórico dos últimos 30 dias.
          </PanelInfo>
        </div>
        <span className="callout">updated {formatTime(updatedAt)}</span>
      </div>

      <div className="panel-body">
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {(beliefs ?? []).map((b, i) => (
            <BeliefRow key={i} b={b} index={i} onClick={onBeliefClick} />
          ))}
        </div>

        {/* didactic legend */}
        <div className="belief-legend">
          <span style={{ color:'var(--red)' }}>▬</span> &lt; 0.35 bearish
          <span className="belief-legend-sep" />
          <span style={{ color:'var(--accent)' }}>▬</span> 0.35 – 0.70 neutro
          <span className="belief-legend-sep" />
          <span style={{ color:'var(--green)' }}>▬</span> &gt; 0.70 bullish
        </div>
      </div>
    </div>
  )
}
