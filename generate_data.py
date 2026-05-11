#!/usr/bin/env python3
"""
Bayesian Robot Data Generator
Simulates a regime-switching Bayesian trading bot operating on B3 stocks.
Output: public/data.json — consumed by the React dashboard.
"""

import json
import os
import math
from datetime import date, timedelta

# ── Lightweight PRNG (no numpy required) ─────────────────────────────────────

class RNG:
    """Xorshift64 + Box-Muller for reproducible pseudo-random numbers."""
    def __init__(self, seed: int = 2026):
        self.state = seed or 1

    def _next(self) -> int:
        x = self.state
        x ^= (x << 13) & 0xFFFFFFFFFFFFFFFF
        x ^= (x >> 7)
        x ^= (x << 17) & 0xFFFFFFFFFFFFFFFF
        self.state = x & 0xFFFFFFFFFFFFFFFF
        return self.state

    def uniform(self) -> float:
        return (self._next() >> 11) / (2**53)

    def normal(self, mu: float = 0.0, sigma: float = 1.0) -> float:
        u1 = max(self.uniform(), 1e-12)
        u2 = self.uniform()
        z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
        return mu + sigma * z


# ── Trading calendar ──────────────────────────────────────────────────────────

def trading_days(start: date, end: date) -> list[date]:
    days, d = [], start
    while d <= end:
        if d.weekday() < 5:
            days.append(d)
        d += timedelta(days=1)
    return days


# ── Bayesian regime model ─────────────────────────────────────────────────────

def simulate(days: list[date], rng: RNG) -> tuple[list[float], list[float], list[float]]:
    """
    Returns daily returns for robot and IBOV, plus per-day regime belief.

    The robot maintains P(regime=risk_on) and updates it each day via a
    likelihood-ratio Bayesian step. Position sizing is proportional to
    belief minus 0.5 (Kelly-inspired).
    """
    regime_belief = 0.55   # P(risk-on) prior
    robot_rets, ibov_rets, beliefs = [], [], []

    for _ in days:
        # Evidence signals: macro, earnings surprise, sentiment
        # Slight positive bias reflects Brazilian 2024-2026 corporate earnings cycle
        macro     = rng.normal(0.08, 0.4)
        earnings  = rng.normal(0.12, 0.55)
        sentiment = rng.normal(0.05, 0.35)

        # Likelihood ratio: risk-on vs risk-off
        log_lr = 0.40 * macro + 0.28 * earnings + 0.18 * sentiment
        lr = math.exp(max(-5.0, min(5.0, log_lr)))

        prior = regime_belief
        posterior = (prior * lr) / (prior * lr + (1 - prior) / lr)
        # Regime is persistent — slow update (mean reversion speed = 0.12)
        regime_belief = 0.88 * prior + 0.12 * posterior
        regime_belief = max(0.08, min(0.92, regime_belief))

        # Daily return parameters depend on regime
        if regime_belief > 0.58:       # Risk-on
            mu_r, sig_r = 0.26 / 252, 0.11 / math.sqrt(252)
            mu_i, sig_i = 0.09 / 252, 0.19 / math.sqrt(252)
        elif regime_belief < 0.42:     # Risk-off
            mu_r, sig_r = -0.04 / 252, 0.09 / math.sqrt(252)
            mu_i, sig_i = -0.13 / 252, 0.26 / math.sqrt(252)
        else:                          # Neutral
            mu_r, sig_r = 0.06 / 252, 0.06 / math.sqrt(252)
            mu_i, sig_i = 0.02 / 252, 0.16 / math.sqrt(252)

        robot_rets.append(rng.normal(mu_r, sig_r))
        ibov_rets.append(rng.normal(mu_i, sig_i))
        beliefs.append(regime_belief)

    return robot_rets, ibov_rets, beliefs


# ── Statistics ────────────────────────────────────────────────────────────────

def cum_ret(rets: list[float]) -> list[float]:
    # Arithmetic cumulative return (standard for portfolio attribution)
    total, result = 0.0, []
    for r in rets:
        total += r
        result.append(total * 100)
    return result


def max_drawdown(rets: list[float]) -> float:
    total, peak, max_dd = 0.0, 0.0, 0.0
    for r in rets:
        total += r
        if total > peak:
            peak = total
        dd = total - peak
        if dd < max_dd:
            max_dd = dd
    return max_dd * 100


def sharpe(rets: list[float]) -> float:
    n = len(rets)
    if n < 2:
        return 0.0
    mu = sum(rets) / n
    var = sum((r - mu) ** 2 for r in rets) / (n - 1)
    std = math.sqrt(var) if var > 0 else 1e-9
    return (mu / std) * math.sqrt(252)


# ── Equity curve builder ──────────────────────────────────────────────────────

def subsample(days: list[date], robot_c: list[float], ibov_c: list[float],
              max_pts: int = 80) -> list[dict]:
    n = len(days)
    if n == 0:
        return []
    step = max(1, n // max_pts)
    indices = list(range(0, n, step))
    if indices[-1] != n - 1:
        indices.append(n - 1)
    return [
        {
            'date': days[i].strftime('%b %d'),
            'robot': round(robot_c[i], 2),
            'ibov':  round(ibov_c[i], 2),
        }
        for i in indices
    ]


def slice_from(all_days, all_robot, all_ibov, start: date):
    idx = next((i for i, d in enumerate(all_days) if d >= start), 0)
    days   = all_days[idx:]
    robot  = all_robot[idx:]
    ibov   = all_ibov[idx:]
    return subsample(days, cum_ret(robot), cum_ret(ibov))


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    rng = RNG(seed=2026)

    today       = date(2026,  5, 10)
    all_start   = date(2024,  5, 10)   # 2-year history
    one_y_start = date(2025,  5, 10)
    ytd_start   = date(2026,  1,  2)
    three_m     = date(2026,  2, 10)
    one_m       = date(2026,  4, 10)

    all_days = trading_days(all_start, today)
    robot_rets, ibov_rets, beliefs = simulate(all_days, rng)

    # Scale YTD robot returns to target +24.8 %
    ytd_idx  = next(i for i, d in enumerate(all_days) if d >= ytd_start)
    ytd_rets = robot_rets[ytd_idx:]
    ytd_total = cum_ret(ytd_rets)[-1] if ytd_rets else 1
    if abs(ytd_total) > 0.01:
        scale = 24.8 / ytd_total
        robot_rets = [r * scale for r in robot_rets]

    # Scale YTD IBOV to target +8.4 %
    ibov_ytd_rets  = ibov_rets[ytd_idx:]
    ibov_ytd_total = cum_ret(ibov_ytd_rets)[-1] if ibov_ytd_rets else 1
    if abs(ibov_ytd_total) > 0.01:
        ibov_scale = 8.4 / ibov_ytd_total
        ibov_rets  = [r * ibov_scale for r in ibov_rets]

    equity_curves = {
        '1M':  slice_from(all_days, robot_rets, ibov_rets, one_m),
        '3M':  slice_from(all_days, robot_rets, ibov_rets, three_m),
        'YTD': slice_from(all_days, robot_rets, ibov_rets, ytd_start),
        '1Y':  slice_from(all_days, robot_rets, ibov_rets, one_y_start),
        'ALL': slice_from(all_days, robot_rets, ibov_rets, all_start),
    }

    # Metrics derived from YTD window
    ytd_robot = robot_rets[ytd_idx:]
    ytd_ibov  = ibov_rets[ytd_idx:]

    pnl        = round(cum_ret(ytd_robot)[-1], 1) if ytd_robot else 24.8
    sr_robot   = round(sharpe(ytd_robot), 2)
    sr_ibov    = round(sharpe(ytd_ibov),  2)
    max_dd     = round(max_drawdown(ytd_robot), 1)

    # Last regime belief from simulation
    last_belief = round(beliefs[-1], 2) if beliefs else 0.67

    data = {
        'meta': {
            'generated_at': '2026-05-10T14:32:08',
            'version': 'v0.3.14',
        },
        'metrics': {
            'pnl_acumulado':   pnl,
            'pnl_1d':          0.42,
            'sharpe_12m':      sr_robot,
            'sharpe_ibov':     sr_ibov,
            'max_drawdown':    max_dd,
            'recovery_days':   14,
            'beta_ibov':       0.31,
            'posicoes_ativas': 14,
            'long_count':      7,
            'short_count':     7,
            'turnover_mensal': 38,
            'custo_pct':       0.18,
        },
        'equity_curve': equity_curves,
        'positions': [
            {'ticker': 'PETR4',  'side': 'LONG',  'entry': 38.42, 'last': 39.81, 'pnl':  3.62, 'held': '12d', 'confidence': 0.71},
            {'ticker': 'CMIG4',  'side': 'SHORT', 'entry': 12.18, 'last': 11.94, 'pnl':  1.97, 'held': '12d', 'confidence': 0.68},
            {'ticker': 'ITUB4',  'side': 'LONG',  'entry': 35.20, 'last': 35.88, 'pnl':  1.93, 'held': '3h',  'confidence': 0.64},
            {'ticker': 'BBDC4',  'side': 'SHORT', 'entry': 15.80, 'last': 15.62, 'pnl':  1.14, 'held': '3h',  'confidence': 0.64},
            {'ticker': 'VALE3',  'side': 'LONG',  'entry': 68.10, 'last': 67.42, 'pnl': -1.00, 'held': '5d',  'confidence': 0.55},
            {'ticker': 'WEGE3',  'side': 'LONG',  'entry': 42.15, 'last': 43.20, 'pnl':  2.49, 'held': '8d',  'confidence': 0.73},
            {'ticker': 'MGLU3',  'side': 'SHORT', 'entry':  8.42, 'last':  8.61, 'pnl': -2.26, 'held': '4d',  'confidence': 0.58},
            {'ticker': 'ABEV3',  'side': 'SHORT', 'entry': 12.80, 'last': 12.65, 'pnl':  1.17, 'held': '9d',  'confidence': 0.62},
            {'ticker': 'RENT3',  'side': 'LONG',  'entry': 45.30, 'last': 46.10, 'pnl':  1.77, 'held': '6d',  'confidence': 0.66},
            {'ticker': 'ELET3',  'side': 'SHORT', 'entry': 41.50, 'last': 41.10, 'pnl':  0.96, 'held': '11d', 'confidence': 0.61},
            {'ticker': 'RADL3',  'side': 'LONG',  'entry': 23.40, 'last': 24.10, 'pnl':  2.99, 'held': '15d', 'confidence': 0.76},
            {'ticker': 'LREN3',  'side': 'SHORT', 'entry': 16.20, 'last': 15.90, 'pnl':  1.85, 'held': '7d',  'confidence': 0.65},
            {'ticker': 'BPAC11', 'side': 'LONG',  'entry': 28.50, 'last': 29.20, 'pnl':  2.46, 'held': '10d', 'confidence': 0.69},
            {'ticker': 'SUZB3',  'side': 'SHORT', 'entry': 52.10, 'last': 53.80, 'pnl': -3.26, 'held': '3d',  'confidence': 0.53},
        ],
        'signal_log': [
            {
                'time': '14:31', 'type': 'bayes', 'tag': 'posterior update',
                'headline': 'PETR4 belief shifted to bullish',
                'detail': 'P(retorno+) 0.58 → 0.71 · driver: release Q1 above consensus',
            },
            {
                'time': '13:18', 'type': 'release', 'tag': 'release',
                'headline': 'VALE3 trimestral published',
                'detail': 'LLM sentiment +0.42 · surpresa receita +0.18 · guidance: manutenção',
            },
            {
                'time': '12:45', 'type': 'macro', 'tag': 'macro',
                'headline': 'Focus revision incorporated',
                'detail': 'IPCA 2026 expectations: 4.2 → 4.0 · risk-on regime confidence +3pp',
            },
            {
                'time': '11:02', 'type': 'bayes', 'tag': 'posterior update',
                'headline': 'ITUB4 / BBDC4 pair spread expanded',
                'detail': 'z-score 2.1 · entry threshold reached · long ITUB4 / short BBDC4 opened',
            },
            {
                'time': '10:34', 'type': 'release', 'tag': 'notícia',
                'headline': 'Brazil Journal: Pão de Açúcar reestruturação',
                'detail': 'LLM relevance 0.81 · setor consumo · update prior atacarejo',
            },
            {
                'time': '09:15', 'type': 'macro', 'tag': 'copom',
                'headline': 'Ata divulgada — tom hawkish moderado',
                'detail': 'LLM tone shift -0.21 vs ata anterior · regime hawkish probability 0.67',
            },
            {
                'time': '08:42', 'type': 'bayes', 'tag': 'rebalance',
                'headline': 'Daily portfolio rebalance executed',
                'detail': '14 positions · turnover 4.2% · est. costs 0.011%',
            },
        ],
        'posterior_beliefs': [
            {
                'label': 'Macro Regime · Risk-On',
                'value': last_belief,
                'note': f'prior 0.52 · updated by Focus revision + Copom ata',
            },
            {
                'label': 'Política Monetária · Hawkish',
                'value': 0.58,
                'note': 'moderado · LLM tone shift -0.21 vs ata anterior',
            },
            {
                'label': 'Setor Consumo · Bullish (3M)',
                'value': 0.42,
                'note': 'restructuring noise · evidência mista',
            },
            {
                'label': 'Setor Bancário · Mean-Reverting',
                'value': 0.81,
                'note': 'cointegração ITUB/BBDC persistente · 24m',
            },
        ],
    }

    os.makedirs('public', exist_ok=True)
    with open('public/data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print('OK public/data.json gerado')
    print(f'   YTD P&L:      {pnl:+.1f}%')
    print(f'   Sharpe (YTD): {sr_robot:.2f}')
    print(f'   Max DD:       {max_dd:.1f}%')
    print(f'   IBOV Sharpe:  {sr_ibov:.2f}')
    print(f'   Regime belief:{last_belief:.2f}')


if __name__ == '__main__':
    main()
