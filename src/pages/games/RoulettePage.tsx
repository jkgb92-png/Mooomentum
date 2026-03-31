import { useState, useRef, useEffect, useCallback } from 'react';
import CosmicBackground from '../../components/CosmicBackground';
import Header from '../../components/Header';
import ParticleSystem from '../../components/ParticleSystem';
import { useGame } from '../../contexts/GameContext';

// ── Physics constants ───────────────────────────────────────────────────────
const WHEEL_DECELERATION = 0.985;
const BALL_DECELERATION  = 0.986;

// ── Roulette layout (European) ──────────────────────────────────────────────
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36,
  11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9,
  22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const TOTAL = WHEEL_NUMBERS.length;

const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

function numColor(n: number): 'red' | 'black' | 'green' {
  if (n === 0) return 'green';
  return RED_NUMS.has(n) ? 'red' : 'black';
}

// ── Bet types ───────────────────────────────────────────────────────────────
type BetType =
  | { kind: 'straight'; num: number }
  | { kind: 'red' | 'black' | 'odd' | 'even' | '1-18' | '19-36' | '1st12' | '2nd12' | '3rd12' };

function betLabel(b: BetType): string {
  if (b.kind === 'straight') return `${b.num}`;
  return b.kind;
}

function betPayout(b: BetType): number {
  if (b.kind === 'straight') return 35;
  if (['red','black','odd','even','1-18','19-36'].includes(b.kind)) return 1;
  return 2; // dozens
}

function betWins(b: BetType, result: number): boolean {
  const c = numColor(result);
  switch (b.kind) {
    case 'straight': return b.num === result;
    case 'red':    return c === 'red';
    case 'black':  return c === 'black';
    case 'odd':    return result !== 0 && result % 2 === 1;
    case 'even':   return result !== 0 && result % 2 === 0;
    case '1-18':   return result >= 1 && result <= 18;
    case '19-36':  return result >= 19 && result <= 36;
    case '1st12':  return result >= 1 && result <= 12;
    case '2nd12':  return result >= 13 && result <= 24;
    case '3rd12':  return result >= 25 && result <= 36;
  }
}

// ── Canvas wheel drawing ────────────────────────────────────────────────────
function drawWheel(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  wheelAngle: number,
  ballAngle: number,
  ballRadius: number,
  winNumber: number | null,
  spinning: boolean,
) {
  ctx.save();
  ctx.clearRect(cx - r - 20, cy - r - 20, (r + 20) * 2, (r + 20) * 2);

  // Outer ring shadow/glow
  const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.15);
  outerGlow.addColorStop(0, 'rgba(139,92,246,0)');
  outerGlow.addColorStop(0.5, 'rgba(139,92,246,0.15)');
  outerGlow.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
  ctx.fill();

  // Outer wooden rim
  const rimGrad = ctx.createRadialGradient(cx - r*0.1, cy - r*0.1, r*0.7, cx, cy, r);
  rimGrad.addColorStop(0, '#2a1a00');
  rimGrad.addColorStop(0.7, '#1a0f00');
  rimGrad.addColorStop(1, '#0d0800');
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Metal edge
  ctx.strokeStyle = 'rgba(200,160,80,0.6)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Sectors
  const sliceAngle = (Math.PI * 2) / TOTAL;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(wheelAngle);

  for (let i = 0; i < TOTAL; i++) {
    const num = WHEEL_NUMBERS[i];
    const startA = i * sliceAngle - sliceAngle / 2;
    const endA   = startA + sliceAngle;
    const color  = numColor(num);
    const isWin  = winNumber !== null && num === winNumber;

    // Sector fill
    let fillColor: string;
    if (color === 'green') fillColor = isWin ? '#22c55e' : '#064e3b';
    else if (color === 'red') fillColor = isWin ? '#ef4444' : '#7f1d1d';
    else fillColor = isWin ? '#6d28d9' : '#1e1b4b';

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.88, startA, endA);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    if (isWin) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Sector border
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.88, startA, endA);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Number text
    const midA = startA + sliceAngle / 2;
    const tr = r * 0.70;
    ctx.save();
    ctx.translate(Math.cos(midA) * tr, Math.sin(midA) * tr);
    ctx.rotate(midA + Math.PI / 2);
    ctx.fillStyle = isWin ? '#fbbf24' : 'rgba(255,255,255,0.85)';
    ctx.font = `bold ${r < 150 ? 8 : 10}px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(num), 0, 0);
    ctx.restore();
  }

  ctx.restore();

  // Inner decorative rings
  const innerR = r * 0.32;

  // Bowl gradient
  const bowl = ctx.createRadialGradient(cx - innerR*0.3, cy - innerR*0.3, 0, cx, cy, innerR * 1.1);
  bowl.addColorStop(0, '#2d1a00');
  bowl.addColorStop(0.6, '#1a0f00');
  bowl.addColorStop(1, '#0d0800');
  ctx.fillStyle = bowl;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR * 1.1, 0, Math.PI * 2);
  ctx.fill();

  // Metal separator ring
  ctx.strokeStyle = 'rgba(200,160,80,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(200,160,80,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR * 1.1, 0, Math.PI * 2);
  ctx.stroke();

  // Center hub
  const hubGrad = ctx.createRadialGradient(cx - 5, cy - 5, 0, cx, cy, 20);
  hubGrad.addColorStop(0, '#c8a020');
  hubGrad.addColorStop(0.5, '#a07010');
  hubGrad.addColorStop(1, '#604000');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,0,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Spokes
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(wheelAngle);
  ctx.strokeStyle = 'rgba(180,130,50,0.4)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 20, Math.sin(a) * 20);
    ctx.lineTo(Math.cos(a) * innerR * 1.05, Math.sin(a) * innerR * 1.05);
    ctx.stroke();
  }
  ctx.restore();

  // Ball
  if (spinning || winNumber !== null) {
    const bx = cx + Math.cos(ballAngle) * ballRadius;
    const by = cy + Math.sin(ballAngle) * ballRadius;

    // Ball shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(bx + 2, by + 2, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball
    const ballGrad = ctx.createRadialGradient(bx - 2, by - 2, 0, bx, by, 7);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.4, '#e8e8e8');
    ballGrad.addColorStop(1, '#888888');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    ctx.fill();

    // Ball shine
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(bx - 2, by - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export default function RoulettePage() {
  const { balance, addBalance, deductBalance } = useGame();

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const animRef      = useRef<number>(0);
  const wheelAngle   = useRef(0);
  const ballAngle    = useRef(0);
  const ballRadius   = useRef(0);
  const wheelSpeed   = useRef(0);
  const ballSpeed    = useRef(0);
  const decelerating = useRef(false);
  const frameCount   = useRef(0);
  const canvasSize   = useRef(360);

  const [phase, setPhase]       = useState<'betting' | 'spinning' | 'result'>('betting');
  const [bets, setBets]         = useState<Map<string, { bet: BetType; amount: number }>>(new Map());
  const [selectedBet, setSelectedBet] = useState<BetType>({ kind: 'red' });
  const [betAmount, setBetAmount] = useState(10);
  const [winNum, setWinNum]     = useState<number | null>(null);
  const [resultMsg, setResultMsg] = useState('');
  const [winAmt, setWinAmt]     = useState(0);
  const [particles, setParticles] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvasSize.current;
    canvas.width  = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const r  = size * 0.46;

    ballRadius.current = r * 0.92;

    const loop = () => {
      if (decelerating.current) {
        wheelSpeed.current *= WHEEL_DECELERATION;
        ballSpeed.current  *= BALL_DECELERATION;
        ballRadius.current  = Math.max(r * 0.72, ballRadius.current - 0.12);
        frameCount.current++;
      }

      wheelAngle.current += wheelSpeed.current;
      ballAngle.current  -= ballSpeed.current;

      const currentWin = winNum;
      drawWheel(ctx, cx, cy, r, wheelAngle.current, ballAngle.current, ballRadius.current, currentWin, wheelSpeed.current > 0.001);

      animRef.current = requestAnimationFrame(loop);
    };

    // Initial static draw
    drawWheel(ctx, cx, cy, r, 0, 0, r * 0.92, null, false);

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [winNum]);

  const placeBet = useCallback(() => {
    const key = JSON.stringify(selectedBet);
    setBets(prev => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (existing) {
        next.set(key, { bet: selectedBet, amount: existing.amount + betAmount });
      } else {
        next.set(key, { bet: selectedBet, amount: betAmount });
      }
      return next;
    });
  }, [selectedBet, betAmount]);

  const clearBets = () => setBets(new Map());

  const spin = useCallback(() => {
    if (phase !== 'betting' || bets.size === 0) return;

    const totalBet = Array.from(bets.values()).reduce((s, v) => s + v.amount, 0);
    if (!deductBalance(totalBet)) return;

    // Pick result
    const resultNumber = WHEEL_NUMBERS[Math.floor(Math.random() * TOTAL)];

    // Find the wheel angle at which this number will stop
    setPhase('spinning');
    setShowResult(false);
    setWinNum(null);

    // Start spinning
    wheelSpeed.current = 0.07;
    ballSpeed.current  = 0.13;
    ballRadius.current = canvasSize.current * 0.46 * 0.92;
    decelerating.current = false;
    frameCount.current   = 0;

    // After 3s start decelerating and settle on result
    const spinDuration = 3200;
    setTimeout(() => {
      decelerating.current = true;

      // After deceleration complete
      setTimeout(() => {
        // Snap wheel to exact result position
        wheelSpeed.current = 0;
        ballSpeed.current  = 0;
        decelerating.current = false;

        // Set win number (triggers red highlight on canvas)
        setWinNum(resultNumber);

        // Resolve bets
        let totalWin = 0;
        for (const { bet, amount } of bets.values()) {
          if (betWins(bet, resultNumber)) {
            totalWin += amount * (betPayout(bet) + 1);
          }
        }

        if (totalWin > 0) {
          addBalance(totalWin);
          setWinAmt(totalWin - totalBet);
          setResultMsg(`${resultNumber} — ${numColor(resultNumber).toUpperCase()} — You Win $${totalWin - totalBet}!`);
          setParticles(p => p + 1);
        } else {
          setWinAmt(0);
          setResultMsg(`${resultNumber} — ${numColor(resultNumber).toUpperCase()} — No Win`);
        }

        setShowResult(true);
        setPhase('result');
        setTimeout(() => setShowResult(false), 3500);
      }, 2800);
    }, spinDuration);
  }, [phase, bets, deductBalance, addBalance]);

  const newRound = () => {
    setPhase('betting');
    setBets(new Map());
    setWinNum(null);
    setResultMsg('');
    setWinAmt(0);
    setShowResult(false);
  };

  const OUTSIDE_BETS: BetType[] = [
    { kind: 'red' }, { kind: 'black' },
    { kind: 'odd' }, { kind: 'even' },
    { kind: '1-18' }, { kind: '19-36' },
    { kind: '1st12' }, { kind: '2nd12' }, { kind: '3rd12' },
  ];

  const isSelected = (b: BetType) => JSON.stringify(b) === JSON.stringify(selectedBet);
  const totalBetAmt = Array.from(bets.values()).reduce((s, v) => s + v.amount, 0);

  // Responsive canvas size
  useEffect(() => {
    const update = () => {
      canvasSize.current = Math.min(360, window.innerWidth - 40);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <>
      <CosmicBackground />
      <Header />
      <ParticleSystem trigger={particles} x={0.5} y={0.35} intensity={winAmt >= 100 ? 'big' : 'medium'} />

      <div className="game-page" style={{ padding: '80px 16px 40px' }}>
        <h1 className="game-title" style={{ color: 'var(--pink-light)' }}>Roulette</h1>
        <div className="game-subtitle">European single zero · 37 numbers</div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', maxWidth: '740px' }}>

          {/* Canvas wheel */}
          <div
            className="roulette-canvas-wrap"
            style={{ position: 'relative' }}
          >
            <canvas
              ref={canvasRef}
              style={{
                borderRadius: '50%',
                filter: 'drop-shadow(0 0 30px rgba(236,72,153,0.3)) drop-shadow(0 0 60px rgba(139,92,246,0.2))',
              }}
            />

            {/* Result overlay */}
            {showResult && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-56px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  padding: '10px 28px',
                  borderRadius: 'var(--radius)',
                  background: winAmt > 0
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))'
                    : 'rgba(10,5,30,0.9)',
                  border: `1px solid ${winAmt > 0 ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  backdropFilter: 'blur(10px)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: winAmt > 0 ? 'var(--green-light)' : 'var(--text-dim)',
                  animation: 'scale-in 0.4s var(--ease-spring)',
                  zIndex: 10,
                }}
              >
                {resultMsg}
              </div>
            )}
          </div>

          {/* Spacing for result overlay */}
          <div style={{ height: showResult ? '56px' : '0', transition: 'height 0.3s' }} />

          {/* Bet board */}
          <div className="glass-dark" style={{ width: '100%', padding: '20px', borderRadius: 'var(--radius-lg)' }}>

            {/* Number grid (0 + 1-36 in 3 columns) */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Straight Up (35:1)
              </div>
              {/* Zero */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                <button
                  className={`roulette-bet-cell green-num ${isSelected({ kind: 'straight', num: 0 }) ? 'selected' : ''}`}
                  style={{ width: '100%' }}
                  onClick={() => setSelectedBet({ kind: 'straight', num: 0 })}
                >
                  0
                </button>
              </div>

              {/* 1-36 grid: 3 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '3px' }}>
                {Array.from({ length: 36 }, (_, i) => i + 1).map(n => {
                  const c = numColor(n);
                  return (
                    <button
                      key={n}
                      className={`roulette-bet-cell ${c === 'red' ? 'red-num' : 'black-num'} ${isSelected({ kind: 'straight', num: n }) ? 'selected' : ''}`}
                      onClick={() => setSelectedBet({ kind: 'straight', num: n })}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Outside bets */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Outside Bets
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '4px' }}>
                {OUTSIDE_BETS.slice(0, 6).map(b => (
                  <button
                    key={b.kind}
                    className={`roulette-bet-cell outside-bet ${isSelected(b) ? 'selected' : ''}`}
                    style={{
                      background: b.kind === 'red'
                        ? 'rgba(127,29,29,0.3)' : b.kind === 'black'
                        ? 'rgba(30,27,75,0.3)' : undefined,
                      color: b.kind === 'red' ? '#fca5a5' : b.kind === 'black' ? '#c4b5fd' : undefined,
                    }}
                    onClick={() => setSelectedBet(b)}
                  >
                    {betLabel(b).toUpperCase()}
                    <span style={{ display: 'block', fontSize: '0.55rem', opacity: 0.6 }}>1:1</span>
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {OUTSIDE_BETS.slice(6).map(b => (
                  <button
                    key={b.kind}
                    className={`roulette-bet-cell outside-bet ${isSelected(b) ? 'selected' : ''}`}
                    onClick={() => setSelectedBet(b)}
                  >
                    {betLabel(b).toUpperCase()}
                    <span style={{ display: 'block', fontSize: '0.55rem', opacity: 0.6 }}>2:1</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chip selector + actions */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '12px' }}>
                {[1,5,10,25,50,100].map(b => (
                  <button
                    key={b}
                    className={`bet-chip ${b <= 1 ? 'chip-1' : b <= 5 ? 'chip-5' : b <= 10 ? 'chip-10' : b <= 25 ? 'chip-25' : b <= 100 ? 'chip-100' : 'chip-500'}`}
                    style={{ outline: betAmount === b ? '2px solid var(--gold)' : 'none', outlineOffset: 3 }}
                    onClick={() => setBetAmount(b)}
                  >
                    ${b}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {phase === 'betting' && (
                  <>
                    <button
                      className="btn btn-purple"
                      onClick={placeBet}
                      disabled={balance < betAmount}
                    >
                      + Place ${betAmount} on {betLabel(selectedBet)}
                    </button>
                    {bets.size > 0 && (
                      <>
                        <button
                          className="btn btn-pink glow-pink"
                          style={{ background: 'linear-gradient(135deg,#be185d,#ec4899)', color: '#fff', boxShadow: '0 4px 20px rgba(236,72,153,0.4)' }}
                          onClick={spin}
                        >
                          🎡 Spin (${totalBetAmt})
                        </button>
                        <button className="btn btn-ghost" onClick={clearBets}>Clear</button>
                      </>
                    )}
                  </>
                )}
                {phase === 'spinning' && (
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--pink)', letterSpacing: '0.15em', animation: 'pulse-pink 1s infinite' }}>
                    ◌ Spinning…
                  </div>
                )}
                {phase === 'result' && (
                  <button className="btn btn-purple glow-purple" onClick={newRound}>New Round</button>
                )}
              </div>

              {/* Active bets summary */}
              {bets.size > 0 && phase === 'betting' && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {Array.from(bets.values()).map(({ bet: b, amount }) => (
                    <div key={JSON.stringify(b)} style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.72rem', color: 'var(--gold-light)', fontFamily: 'var(--font-display)' }}>
                      {betLabel(b).toUpperCase()} ${amount}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                Balance: <span style={{ color: 'var(--gold-light)' }}>${balance}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
