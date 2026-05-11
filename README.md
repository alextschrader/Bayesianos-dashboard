# Bayesianos.

**Quant AI Dashboard — Itaú Asset 2026 · Synthesis Engine v0.3**

Dashboard interativo de um robô bayesiano operando na B3. Construído em React + Vite com dados simulados por um modelo de regime-switching.

![stack](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react) ![stack](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite) ![stack](https://img.shields.io/badge/Recharts-2-22b5bf?style=flat-square) ![stack](https://img.shields.io/badge/Python-3.12-3776ab?style=flat-square&logo=python)

**[bayesianos-dashboard.vercel.app](https://bayesianos-dashboard.vercel.app/)**

---

## O que é

Simulação de um sistema de trading quantitativo baseado em inferência bayesiana. O robô mantém distribuições de probabilidade (`P(retorno+)`) sobre ativos da B3, atualizando-as continuamente com evidências de mercado — releases de earnings, dados macro, tom do BCB, spreads de pares.

O dashboard é uma interface de monitoramento em tempo real dessas crenças e das posições abertas.

---

## Features

### Dados
- **`generate_data.py`** — simula 2 anos de histórico com modelo de regime-switching (risk-on / risk-off)
- Atualização bayesiana via likelihood-ratio a cada dia simulado
- Escala o retorno YTD para exatamente **+24.8%** / IBOV **+8.4%**
- Sem dependências externas — stdlib Python pura (sem numpy)

### Dashboard
| Painel | O que mostra |
|--------|-------------|
| **Equity Curve** | Curva do robô vs IBOV com toggle 1M / 3M / YTD / 1Y / ALL e hover tooltip |
| **Métricas** | P&L, Sharpe, Max Drawdown, Beta, Posições, Turnover — hover explica cada uma |
| **Posições** | 14 posições live com preços oscilando a cada 2s e flash verde/vermelho |
| **Evidence Stream** | Feed de eventos bayesianos gerado a cada 8–15s com slide-in animation |
| **Posterior Beliefs** | 4 beliefs de regime com barras animadas reagindo a eventos macro/copom |

### Interações por clique

**Linha de posição** → painel lateral deslizando da direita com:
- Mini chart de preço (Brownian bridge entre entry e last — determinístico por ticker via LCG seed)
- Razão da entrada: qual evento bayesiano gerou a posição (pair trade, posterior update, macro, momentum)
- Histórico de confiança ao longo do tempo — line chart azul convergindo para o valor atual

**Belief de regime** → modal centralizado com:
- Sparkline dos últimos 30 dias derivada do valor atual
- Stats: mínimo, médio, máximo, valor atual, tendência ▲/▼

**Evento do feed** → modal com análise de impacto:
- `macro` → mostra a belief "Macro Regime · Risk-On" com barra animada e delta ao vivo
- `copom` → mostra "Política Monetária · Hawkish" da mesma forma
- `bayes` / `release` → explica que afeta posteriors individuais, não o regime macro

Fechar: `ESC` ou clique fora do modal.

### Detalhes vivos

- **Status dot** — pulse verde contínuo no header (`@keyframes pulse`)
- **Timestamp** — atualiza segundo a segundo em tempo real
- **Hover nas métricas** — tooltip explicativo em cada uma das 6 cards:
  - P&L Acumulado: base de cálculo YTD, net de custos
  - Sharpe: fórmula (R_p − R_f) / σ_p × √252
  - Max Drawdown: definição pico-a-vale
  - Beta IBOV: o que significa 0.31 e o target do modelo
  - Posições Ativas: Kelly Criterion bayesiano f* = (p·b − q) / b
  - Turnover Mensal: giro estimado + custo mensal

---

## Stack

```
React 18 + Vite 5
Recharts 2          # equity curve, mini charts nos modais
Python 3.12         # gerador de dados (stdlib only)
JetBrains Mono      # fonte monospace
Fraunces            # fonte serif para valores numéricos
```

---

## Rodando localmente

```bash
# 1. instalar dependências
npm install

# 2. gerar dados simulados
python generate_data.py

# 3. dev server
npm run dev
# → http://localhost:5173
```

Para regenerar os dados com novos seeds:
```bash
python generate_data.py
```

O arquivo `public/data.json` é lido pelo React via `fetch` — edite o script para ajustar parâmetros da simulação.

---

## Estrutura

```
bayesianos-dashboard/
├── generate_data.py              # simulação do robô bayesiano
├── public/
│   └── data.json                 # dados gerados (equity curves, posições, beliefs)
└── src/
    ├── App.jsx                   # orquestra todos os hooks e modais
    ├── App.css                   # design system completo (dark theme, variáveis CSS)
    ├── hooks/
    │   ├── useLivePrices.js      # oscilação de preços a cada 2.2s
    │   ├── useEventStream.js     # gerador de eventos bayesianos (8–15s)
    │   └── useLiveBeliefs.js     # beliefs reagem a eventos macro/copom
    ├── components/
    │   ├── EquityCurve.jsx       # recharts com toggle de período
    │   ├── MetricsRow.jsx        # 6 métricas com tooltips explicativos
    │   ├── PositionsTable.jsx    # tabela live com flash animations
    │   ├── SignalLog.jsx         # evidence stream com slide-in
    │   ├── PosteriorBeliefs.jsx  # barras bayesianas animadas
    │   ├── PositionModal.jsx     # painel lateral de posição
    │   ├── BeliefModal.jsx       # sparkline 30 dias de belief
    │   └── EventModal.jsx        # análise de impacto de evento
    └── utils/
        └── generateHistory.js    # histórico determinístico por ticker (LCG seed)
```

---

## Modelo bayesiano

O robô mantém `P(regime = risk_on)` e atualiza via:

```
posterior = (prior × LR) / (prior × LR + (1 − prior) × 1/LR)

LR = exp(0.40 × macro + 0.28 × earnings + 0.18 × sentiment)
```

O sizing de cada posição segue o **Kelly Criterion**:

```
f* = (p × b − q) / b
```

onde `p = P(retorno+)` do modelo e `b` é o payoff esperado.
