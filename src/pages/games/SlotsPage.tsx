import { useState, useRef, useCallback } from 'react';
import CosmicBackground from '../../components/CosmicBackground';
import Header from '../../components/Header';
import ParticleSystem from '../../components/ParticleSystem';
import { useGame } from '../../contexts/GameContext';

// ── Symbols ─────────────────────────────────────────────────────────────────
const SYMBOL_WEIGHTS: Record<string, number> = {
  '💎': 1, '👑': 2, '🌟': 3, '⚡': 5, '🔥': 7, '🍀': 8, '🌙': 10, '🎰': 12,
};

const PAYOUTS: Record<string, number> = {
  '💎💎💎💎💎': 5000, '💎💎💎💎': 500, '💎💎💎': 100,
  '👑👑👑👑👑': 1000, '👑👑👑👑': 200, '👑👑👑': 50,
  '🌟🌟🌟🌟🌟': 500,  '🌟🌟🌟🌟': 100, '🌟🌟🌟': 30,
  '⚡⚡⚡⚡⚡': 250,   '⚡⚡⚡⚡': 60,  '⚡⚡⚡': 15,
  '🔥🔥🔥🔥🔥': 150,  '🔥🔥🔥🔥': 40,  '🔥🔥🔥': 10,
  '🍀🍀🍀🍀🍀': 100,  '🍀🍀🍀🍀': 25,  '🍀🍀🍀': 8,
  '🌙🌙🌙🌙🌙': 80,   '🌙🌙🌙🌙': 20,  '🌙🌙🌙': 6,
  '🎰🎰🎰🎰🎰': 50,   '🎰🎰🎰🎰': 12,  '🎰🎰🎰': 4,
};

const ROWS = 3;
const REELS = 5;
const SYMBOL_H = 90;
const STRIP_LEN = 24; // symbols in each generated strip

function weightedRandom(): string {
  const pool: string[] = [];
  for (const [sym, w] of Object.entries(SYMBOL_WEIGHTS)) {
    for (let i = 0; i < w; i++) pool.push(sym);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildStrip(resultSymbol: string): string[] {
  // Build strip where the middle visible row (index 1) after spin lands on resultSymbol.
  // Strip has STRIP_LEN entries; we'll offset to land on index STRIP_LEN - ROWS + 1 (middle row)
  const strip: string[] = [];
  for (let i = 0; i < STRIP_LEN; i++) strip.push(weightedRandom());
  // Place result at a specific landing index
  const landingIdx = STRIP_LEN - 2; // second from bottom — middle row shows this
  strip[landingIdx] = resultSymbol;
  // Fill above/below randomly
  if (landingIdx > 0)              strip[landingIdx - 1] = weightedRandom();
  if (landingIdx < STRIP_LEN - 1) strip[landingIdx + 1] = weightedRandom();
  return strip;
}

function checkWins(midRow: string[]): { payout: number; key: string; line: boolean[] } {
  // Check paylines: full row match (3, 4, 5 of a kind from left)
  const sym = midRow[0];
  let len = 1;
  while (len < REELS && midRow[len] === sym) len++;

  const key = midRow.slice(0, len).join('');
  const payout = PAYOUTS[key] ?? 0;
  const line = midRow.map((_, i) => i < len);
  return { payout, key, line };
}

type WinIntensity = 'small' | 'medium' | 'big' | 'jackpot';

function winIntensity(mult: number): WinIntensity {
  if (mult >= 500)  return 'jackpot';
  if (mult >= 100)  return 'big';
  if (mult >= 20)   return 'medium';
  return 'small';
}

export default function SlotsPage() {
  const { balance, addBalance, deductBalance } = useGame();

  // Each reel: array of symbol strips and current visible window
  const [strips, setStrips] = useState<string[][]>(
    () => Array.from({ length: REELS }, () => Array.from({ length: STRIP_LEN }, weightedRandom))
  );
  const [offsets, setOffsets] = useState<number[]>(
    () => Array.from({ length: REELS }, () => -(STRIP_LEN - ROWS - 1) * SYMBOL_H)
  );
  const [spinning, setSpinning] = useState<boolean[]>(Array(REELS).fill(false));
  const [winLine, setWinLine] = useState<boolean[]>(Array(REELS).fill(false));
  const [bet, setBet] = useState(10);
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [resultMsg, setResultMsg] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const [particles, setParticles] = useState(0);
  const [particleIntensity, setParticleIntensity] = useState<WinIntensity>('medium');
  const [showResult, setShowResult] = useState(false);

  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const spin = useCallback(() => {
    if (phase === 'spinning') return;
    if (!deductBalance(bet)) return;

    // Clear previous timers
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    setShowResult(false);
    setWinLine(Array(REELS).fill(false));
    setResultMsg('');
    setWinAmount(0);
    setPhase('spinning');

    // Determine results
    const results: string[] = Array.from({ length: REELS }, weightedRandom);
    const newStrips: string[][] = results.map(sym => buildStrip(sym));

    // Final offset: strip landing so index STRIP_LEN-2 is in middle visible row
    // Visible window shows indices [finalIdx..finalIdx+ROWS-1]
    // Middle row = finalIdx+1, we want strip[STRIP_LEN-2] there → finalIdx = STRIP_LEN-3
    const finalOffset = -(STRIP_LEN - 3) * SYMBOL_H;

    setStrips(newStrips);

    // Start each reel spinning staggered
    const spinningState = Array(REELS).fill(false);
    for (let i = 0; i < REELS; i++) {
      const startT = setTimeout(() => {
        setSpinning(prev => { const n = [...prev]; n[i] = true; return n; });
      }, i * 120);
      timerRefs.current.push(startT);

      const stopT = setTimeout(() => {
        setSpinning(prev => { const n = [...prev]; n[i] = false; spinningState[i] = false; return n; });
        setOffsets(prev => { const n = [...prev]; n[i] = finalOffset; return n; });

        // When last reel stops
        if (i === REELS - 1) {
          const t = setTimeout(() => {
            // Read middle row from results
            const midRow = results;
            const { payout, line } = checkWins(midRow);

            if (payout > 0) {
              const won = bet * payout;
              addBalance(won);
              setWinAmount(won);
              setWinLine(line);
              setResultMsg(payout >= 500 ? '🌟 JACKPOT! 🌟' : payout >= 100 ? '💎 BIG WIN! 💎' : payout >= 20 ? '⚡ GREAT WIN! ⚡' : '✨ WIN! ✨');
              setParticleIntensity(winIntensity(payout));
              setParticles(p => p + 1);
              setShowResult(true);
              setTimeout(() => setShowResult(false), 2800);
            } else {
              setResultMsg('Try again...');
              setShowResult(true);
              setTimeout(() => setShowResult(false), 1200);
            }
            setPhase('idle');
          }, 400);
          timerRefs.current.push(t);
        }
      }, i * 120 + 1600 + i * 200);
      timerRefs.current.push(stopT);
    }
  }, [phase, bet, deductBalance, addBalance]);

  const BET_OPTIONS = [1, 5, 10, 25, 50, 100];

  return (
    <>
      <CosmicBackground />
      <Header />
      <ParticleSystem trigger={particles} x={0.5} y={0.45} intensity={particleIntensity} />

      <div className="game-page">
        {/* Title */}
        <h1 className="game-title text-glow-purple" style={{ color: 'var(--purple-light)' }}>
          Cosmic Slots
        </h1>
        <div className="game-subtitle">Five reels · Eight symbols · Infinite fortune</div>

        {/* Machine */}
        <div className="slots-machine" style={{ width: '100%', maxWidth: '600px' }}>
          {/* Reels */}
          <div className="slots-reels">
            {strips.map((strip, rI) => (
              <div
                key={rI}
                className="reel-window"
                style={{ flex: 1, maxWidth: 96 }}
              >
                <div
                  className="reel-strip"
                  style={{
                    transform: spinning[rI]
                      ? undefined
                      : `translateY(${offsets[rI]}px)`,
                    transition: spinning[rI] ? 'none' : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                    animation: spinning[rI]
                      ? `reel-spin-anim ${1.2 + rI * 0.15}s ease-in-out forwards`
                      : 'none',
                    ['--reel-offset' as string]: `${offsets[rI] - 300}px`,
                    ['--reel-final' as string]:  `${offsets[rI]}px`,
                    ['--spin-duration' as string]: `${1.2 + rI * 0.15}s`,
                  }}
                >
                  {strip.map((sym, sI) => (
                    <div
                      key={sI}
                      className={`reel-symbol ${winLine[rI] && sI === STRIP_LEN - 2 ? 'lit' : ''}`}
                      style={{
                        height: SYMBOL_H,
                        textShadow: winLine[rI] && sI === STRIP_LEN - 2
                          ? '0 0 20px gold, 0 0 40px gold'
                          : '0 0 8px rgba(255,255,255,0.3)',
                      }}
                    >
                      {sym}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Result message */}
          {showResult && (
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                marginTop: '12px',
                borderRadius: 'var(--radius)',
                background: winAmount > 0
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${winAmount > 0 ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                animation: 'scale-in 0.3s var(--ease-spring)',
              }}
            >
              {winAmount > 0 ? (
                <>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--gold-light)', letterSpacing: '0.05em' }}>
                    {resultMsg}
                  </div>
                  <div style={{ color: 'var(--green-light)', fontFamily: 'var(--font-display)', fontSize: '1rem', marginTop: 4 }}>
                    +${winAmount.toLocaleString()}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
                  {resultMsg}
                </div>
              )}
            </div>
          )}

          <div className="divider" />

          {/* Bet controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.3em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Bet Amount
            </div>
            <div className="bet-controls">
              {BET_OPTIONS.map(b => (
                <button
                  key={b}
                  onClick={() => setBet(b)}
                  className={`bet-chip ${b <= 1 ? 'chip-1' : b <= 5 ? 'chip-5' : b <= 10 ? 'chip-10' : b <= 25 ? 'chip-25' : b <= 100 ? 'chip-100' : 'chip-500'}`}
                  style={{
                    outline: bet === b ? `2px solid var(--gold)` : 'none',
                    outlineOffset: '3px',
                    transform: bet === b ? 'scale(1.1) translateY(-2px)' : undefined,
                  }}
                  aria-label={`Bet $${b}`}
                >
                  ${b}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span className="bet-display" style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Bet: <strong style={{ color: 'var(--gold-light)' }}>${bet}</strong>
              </span>
              <span className="bet-display" style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Balance: <strong style={{ color: 'var(--green-light)' }}>${balance}</strong>
              </span>
            </div>

            <button
              className={`btn ${phase === 'spinning' ? 'btn-ghost' : 'btn-purple'} glow-purple`}
              onClick={spin}
              disabled={phase === 'spinning' || balance < bet}
              style={{
                padding: '16px 60px',
                fontSize: '1rem',
                letterSpacing: '0.15em',
                minWidth: '200px',
              }}
            >
              {phase === 'spinning' ? '⟳  SPINNING…' : '▶  SPIN'}
            </button>
          </div>

          <div className="divider" />

          {/* Payout table */}
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', userSelect: 'none' }}>
              Paytable
            </summary>
            <div style={{ marginTop: '12px' }}>
              <table className="payout-table">
                <tbody>
                  {[
                    ['💎💎💎💎💎', 5000], ['👑👑👑👑👑', 1000], ['🌟🌟🌟🌟🌟', 500],
                    ['💎💎💎💎', 500],   ['👑👑👑👑', 200],   ['🌟🌟🌟🌟', 100],
                    ['💎💎💎', 100],     ['👑👑👑', 50],      ['🌟🌟🌟', 30],
                    ['⚡⚡⚡', 15],      ['🔥🔥🔥', 10],      ['🍀🍀🍀', 8],
                  ].map(([combo, mult]) => (
                    <tr key={String(combo)}>
                      <td style={{ fontSize: '1rem', letterSpacing: '2px' }}>{combo}</td>
                      <td>{mult}× bet</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </>
  );
}
