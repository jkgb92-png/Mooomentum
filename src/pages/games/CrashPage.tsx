import { useState, useRef, useEffect, useCallback } from 'react';
import CosmicBackground from '../../components/CosmicBackground';
import Header from '../../components/Header';
import ParticleSystem from '../../components/ParticleSystem';
import { useGame } from '../../contexts/GameContext';

// ── Crash math ────────────────────────────────────────────────────────────
const INSTANT_CRASH_PROBABILITY = 0.04; // 4% chance of immediate crash (house edge)

function generateCrashPoint(): number {
  // Exponential distribution; house edge ~4%
  const r = Math.random();
  if (r < INSTANT_CRASH_PROBABILITY) return 1.00;
  return Math.max(1.01, parseFloat((1 / (1 - r * (1 - INSTANT_CRASH_PROBABILITY))).toFixed(2)));
}

function easeMultiplier(elapsed: number): number {
  // Multiplier grows roughly as e^(0.00006 * elapsed_ms)
  return Math.max(1, parseFloat(Math.exp(0.000085 * elapsed).toFixed(2)));
}

type Phase = 'waiting' | 'running' | 'crashed' | 'cashed';

export default function CrashPage() {
  const { balance, addBalance, deductBalance } = useGame();

  const [phase, setPhase]         = useState<Phase>('waiting');
  const [bet, setBet]             = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(1.00);
  const [cashedAt, setCashedAt]   = useState<number | null>(null);
  const [particles, setParticles] = useState(0);
  const [history, setHistory]     = useState<{ x: number }[]>([]);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const startTime   = useRef<number>(0);
  const animRef     = useRef<number>(0);
  const crashRef    = useRef<number>(1);
  const phaseRef    = useRef<Phase>('waiting');
  const multRef     = useRef(1.00);
  const hasDeducted = useRef(false);

  // Sync refs
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { multRef.current  = multiplier; }, [multiplier]);

  // Canvas draw
  const drawCrash = useCallback((
    ctx: CanvasRenderingContext2D,
    W: number, H: number,
    points: { x: number; y: number }[],
    crashed: boolean,
    currentMult: number,
  ) => {
    ctx.clearRect(0, 0, W, H);

    if (points.length < 2) return;

    // Grid
    ctx.strokeStyle = 'rgba(139,92,246,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += W / 10) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += H / 6) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '11px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    const mults = [1, 2, 5, 10, 20];
    for (const m of mults) {
      const fy = H - ((Math.log(m) / Math.log(currentMult + 1)) * H * 0.85);
      if (fy > 10 && fy < H - 5) {
        ctx.fillText(`${m}×`, 6, fy);
      }
    }

    // Gradient fill under curve
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    if (crashed) {
      gradient.addColorStop(0, 'rgba(239,68,68,0.3)');
      gradient.addColorStop(1, 'rgba(239,68,68,0.02)');
    } else {
      gradient.addColorStop(0, 'rgba(139,92,246,0.2)');
      gradient.addColorStop(0.5, 'rgba(6,182,212,0.15)');
      gradient.addColorStop(1, 'rgba(16,185,129,0.05)');
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, H);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.lineTo(points[points.length - 1].x, H);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Curve stroke
    const lineGrad = ctx.createLinearGradient(
      points[0].x, points[0].y,
      points[points.length - 1].x, points[points.length - 1].y,
    );
    if (crashed) {
      lineGrad.addColorStop(0, '#f59e0b');
      lineGrad.addColorStop(1, '#ef4444');
    } else {
      lineGrad.addColorStop(0,   '#10b981');
      lineGrad.addColorStop(0.5, '#06b6d4');
      lineGrad.addColorStop(1,   '#8b5cf6');
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cp = points[i - 1];
      const p  = points[i];
      ctx.quadraticCurveTo(
        cp.x, cp.y,
        (cp.x + p.x) / 2, (cp.y + p.y) / 2,
      );
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap  = 'round';
    ctx.shadowBlur  = crashed ? 20 : 12;
    ctx.shadowColor = crashed ? 'rgba(239,68,68,0.8)' : 'rgba(139,92,246,0.6)';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Rocket / explosion at tip
    if (!crashed && points.length > 0) {
      const tip = points[points.length - 1];
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur  = 15;
      ctx.shadowColor = 'rgba(139,92,246,0.9)';
      ctx.fillText('🚀', tip.x + 12, tip.y - 12);
      ctx.shadowBlur = 0;
    }

    if (crashed && points.length > 0) {
      const tip = points[points.length - 1];
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.fillText('💥', tip.x, tip.y - 10);
    }
  }, []);

  // Animation loop
  const runGame = useCallback((cp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const PAD = 32;
    const usableW = W - PAD;
    const usableH = H - PAD;

    startTime.current = performance.now();
    const chartPoints: { x: number; y: number }[] = [];

    const loop = (now: number) => {
      const elapsed = now - startTime.current;
      const mult = easeMultiplier(elapsed);
      multRef.current = mult;
      setMultiplier(parseFloat(mult.toFixed(2)));

      // Scale points to canvas
      const progress = Math.min(1, elapsed / 18000); // normalize x over 18s
      const px = PAD + progress * usableW;
      // log scale y
      const logScale = Math.log(Math.max(1.01, mult)) / Math.log(cp + 1);
      const py = usableH - (logScale * usableH * 0.85) + PAD * 0.5;

      chartPoints.push({ x: px, y: py });

      // Keep limited history for perf
      if (chartPoints.length > 500) chartPoints.shift();

      drawCrash(ctx, W, H, chartPoints, false, mult);

      if (mult >= cp) {
        // Crash!
        drawCrash(ctx, W, H, chartPoints, true, mult);
        setPhase('crashed');
        phaseRef.current = 'crashed';
        cancelAnimationFrame(animRef.current);
        return;
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
  }, [drawCrash]);

  const startRound = useCallback(() => {
    if (phase !== 'waiting') return;
    if (!deductBalance(bet)) return;
    hasDeducted.current = true;

    const cp = generateCrashPoint();
    crashRef.current = cp;
    setCrashPoint(cp);
    setCashedAt(null);
    setMultiplier(1.00);
    setPhase('running');
    phaseRef.current = 'running';

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    runGame(cp);
  }, [phase, bet, deductBalance, runGame]);

  const cashOut = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    const mult = multRef.current;
    cancelAnimationFrame(animRef.current);
    const won = Math.floor(bet * mult);
    addBalance(won);
    setCashedAt(mult);
    setPhase('cashed');
    phaseRef.current = 'cashed';
    setParticles(p => p + 1);
    setHistory(prev => [{ x: mult }, ...prev.slice(0, 7)]);
  }, [bet, addBalance]);

  // Handle crash outcome
  useEffect(() => {
    if (phase === 'crashed') {
      setHistory(prev => [{ x: crashPoint }, ...prev.slice(0, 7)]);
    }
  }, [phase, crashPoint]);

  const newRound = () => {
    setPhase('waiting');
    setMultiplier(1.00);
    setCashedAt(null);
    hasDeducted.current = false;
  };

  // Canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = Math.min(640, window.innerWidth - 32);
      canvas.height = 280;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const multClass =
    phase === 'crashed' ? 'crashed' :
    multiplier >= 3     ? 'danger'  :
                          'safe';

  const BET_OPTS = [5, 10, 25, 50, 100, 200];

  return (
    <>
      <CosmicBackground />
      <Header />
      <ParticleSystem
        trigger={particles}
        x={0.5} y={0.4}
        intensity={cashedAt && cashedAt >= 5 ? 'big' : 'medium'}
      />

      <div className="game-page" style={{ padding: '80px 16px 40px' }}>
        <h1 className="game-title" style={{ color: 'var(--gold-light)' }}>Crash</h1>
        <div className="game-subtitle">Cash out before it explodes · No second chances</div>

        <div style={{ width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Multiplier display */}
          <div
            className="glass-panel"
            style={{ textAlign: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}
          >
            {/* Background pulse when running */}
            {phase === 'running' && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(circle at 50% 80%, rgba(139,92,246,0.1) 0%, transparent 70%)',
                animation: 'float 2s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
            )}

            <div className={`crash-multiplier ${multClass}`}>
              {phase === 'crashed'
                ? `💥 ${crashPoint.toFixed(2)}×`
                : phase === 'cashed'
                ? `✅ ${cashedAt?.toFixed(2)}×`
                : `${multiplier.toFixed(2)}×`}
            </div>

            {phase === 'crashed' && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--red-light)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
                CRASHED AT {crashPoint.toFixed(2)}×
              </div>
            )}

            {phase === 'cashed' && cashedAt && (
              <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--green-light)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
                +${(Math.floor(bet * cashedAt) - bet).toLocaleString()} profit
              </div>
            )}
          </div>

          {/* Chart canvas */}
          <div
            style={{
              position: 'relative',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(139,92,246,0.2)',
              overflow: 'hidden',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ display: 'block', width: '100%' }}
            />
            {phase === 'waiting' && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '8px',
              }}>
                <div style={{ fontSize: '2.5rem' }}>🚀</div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.2em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}>
                  Place your bet and launch
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="glass-dark" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
            {phase === 'waiting' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Bet Amount
                  </div>
                  <div className="bet-controls">
                    {BET_OPTS.map(b => (
                      <button
                        key={b}
                        className={`bet-chip ${b <= 5 ? 'chip-5' : b <= 10 ? 'chip-10' : b <= 25 ? 'chip-25' : b <= 100 ? 'chip-100' : 'chip-500'}`}
                        style={{ outline: bet === b ? '2px solid var(--gold)' : 'none', outlineOffset: 3 }}
                        onClick={() => setBet(b)}
                      >
                        ${b}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    className="btn btn-gold glow-gold"
                    style={{ padding: '16px 60px', fontSize: '1rem', minWidth: '220px' }}
                    onClick={startRound}
                    disabled={balance < bet}
                  >
                    🚀 Launch (${bet})
                  </button>
                </div>
              </>
            )}

            {phase === 'running' && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  className="btn btn-green glow-green"
                  style={{ padding: '18px 70px', fontSize: '1.1rem', minWidth: '240px', letterSpacing: '0.1em' }}
                  onClick={cashOut}
                >
                  💰 Cash Out {multiplier.toFixed(2)}×
                  <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8, marginTop: 2 }}>
                    = ${Math.floor(bet * multiplier)}
                  </span>
                </button>
              </div>
            )}

            {(phase === 'crashed' || phase === 'cashed') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                {phase === 'crashed' && (
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--red-light)', letterSpacing: '0.1em' }}>
                    Lost ${bet} · Crashed at {crashPoint.toFixed(2)}×
                  </div>
                )}
                <button
                  className="btn btn-purple glow-purple"
                  style={{ minWidth: '200px' }}
                  onClick={newRound}
                >
                  Play Again
                </button>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              Balance: <span style={{ color: 'var(--gold-light)' }}>${balance}</span>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: h.x < 1.5 ? 'rgba(239,68,68,0.1)' : h.x >= 5 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: h.x < 1.5 ? 'var(--red-light)' : h.x >= 5 ? 'var(--green-light)' : 'var(--gold-light)',
                    border: `1px solid ${h.x < 1.5 ? 'rgba(239,68,68,0.3)' : h.x >= 5 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  }}
                >
                  {h.x.toFixed(2)}×
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
