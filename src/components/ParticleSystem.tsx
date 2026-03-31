import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
  gravity: number;
  spin: number;
  shape: 'circle' | 'star' | 'diamond';
}

interface ParticleSystemProps {
  trigger: number;       // increment to fire
  x?: number;           // origin x (0-1 relative)
  y?: number;           // origin y (0-1 relative)
  intensity?: 'small' | 'medium' | 'big' | 'jackpot';
}

const PALETTE_MEDIUM = [[255,215,0],[255,165,0],[255,255,100],[200,255,100]];
const PALETTE_BIG    = [[139,92,246],[6,182,212],[236,72,153],[245,158,11],[52,211,153]];
const PALETTE_JACKPOT = [[255,215,0],[255,255,255],[255,100,200],[100,220,255],[180,100,255],[255,160,50]];

function makeParticles(
  cx: number, cy: number,
  count: number,
  palette: number[][],
  speed: number,
  gravity: number,
): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const spd   = (0.5 + Math.random()) * speed;
    const col   = palette[Math.floor(Math.random() * palette.length)];
    return {
      x: cx, y: cy,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - Math.random() * speed * 0.5,
      life: 0,
      maxLife: 60 + Math.random() * 60,
      size: 3 + Math.random() * 8,
      r: col[0], g: col[1], b: col[2],
      gravity,
      spin: (Math.random() - 0.5) * 0.3,
      shape: (['circle','star','diamond'] as const)[Math.floor(Math.random() * 3)],
    };
  });
}

export default function ParticleSystem({ trigger, x = 0.5, y = 0.5, intensity = 'medium' }: ParticleSystemProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const particles  = useRef<Particle[]>([]);
  const animRef    = useRef<number>(0);
  const activeRef  = useRef(false);

  const drawStar = useCallback((ctx: CanvasRenderingContext2D, px: number, py: number, size: number, rot: number) => {
    const spikes = 5;
    const outer  = size;
    const inner  = size * 0.45;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = rot + (i * Math.PI) / spikes;
      if (i === 0) ctx.moveTo(px + Math.cos(a) * r, py + Math.sin(a) * r);
      else         ctx.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  }, []);

  const drawDiamond = useCallback((ctx: CanvasRenderingContext2D, px: number, py: number, size: number) => {
    ctx.beginPath();
    ctx.moveTo(px,           py - size);
    ctx.lineTo(px + size * 0.6, py);
    ctx.lineTo(px,           py + size);
    ctx.lineTo(px - size * 0.6, py);
    ctx.closePath();
    ctx.fill();
  }, []);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const living: Particle[] = [];
    for (const p of particles.current) {
      p.x   += p.vx;
      p.y   += p.vy;
      p.vy  += p.gravity;
      p.vx  *= 0.99;
      p.life++;

      const progress = p.life / p.maxLife;
      const alpha = progress < 0.2 ? progress * 5 : 1 - (progress - 0.2) / 0.8;

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;

      // Add glow
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${p.r},${p.g},${p.b},0.7)`;

      const s = p.size * (1 - progress * 0.3);
      const rot = p.life * p.spin;

      if (p.shape === 'star')         drawStar(ctx, p.x, p.y, s, rot);
      else if (p.shape === 'diamond') drawDiamond(ctx, p.x, p.y, s);
      else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      if (p.life < p.maxLife) living.push(p);
    }

    particles.current = living;

    if (living.length > 0) {
      animRef.current = requestAnimationFrame(loop);
    } else {
      activeRef.current = false;
    }
  }, [drawStar, drawDiamond]);

  useEffect(() => {
    if (trigger === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = x * canvas.width;
    const cy = y * canvas.height;

    let newParticles: Particle[] = [];

    switch (intensity) {
      case 'small':
        newParticles = makeParticles(cx, cy, 30, PALETTE_MEDIUM, 4, 0.12);
        break;
      case 'medium':
        newParticles = makeParticles(cx, cy, 60, PALETTE_MEDIUM, 6, 0.1);
        break;
      case 'big':
        newParticles = makeParticles(cx, cy, 100, PALETTE_BIG, 9, 0.08);
        break;
      case 'jackpot': {
        // Multiple burst origins
        const origins = [[cx, cy], [cx - 100, cy - 50], [cx + 100, cy - 50], [cx, cy - 120]];
        for (const [ox, oy] of origins) {
          newParticles = newParticles.concat(makeParticles(ox, oy, 80, PALETTE_JACKPOT, 12, 0.06));
        }
        break;
      }
    }

    particles.current = [...particles.current, ...newParticles];

    if (!activeRef.current) {
      activeRef.current = true;
      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(loop);
    }
  }, [trigger, x, y, intensity, loop]);

  return (
    <canvas
      ref={canvasRef}
      className="particles-canvas"
      style={{ width: '100vw', height: '100vh' }}
      aria-hidden
    />
  );
}
