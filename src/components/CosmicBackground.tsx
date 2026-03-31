import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  phase: number;
  speed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
}

interface NebulaBlob {
  x: number;
  y: number;
  radius: number;
  r: number;
  g: number;
  b: number;
  vx: number;
  vy: number;
  phase: number;
}

// ── Star count ────────────────────────────────────────────────────────────
const STAR_COUNT = 280;

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    // Resize
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate stars
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x:          Math.random(),
      y:          Math.random(),
      size:       Math.random() * 2.2 + 0.3,
      brightness: Math.random(),
      phase:      Math.random() * Math.PI * 2,
      speed:      Math.random() * 0.015 + 0.005,
    }));

    // Nebula blobs
    const palettes = [
      [100, 50, 220],  // deep purple
      [20,  160, 210], // cyan
      [200, 50,  150], // magenta
      [50,  80,  200], // blue
      [160, 30,  200], // violet
    ];
    const nebulae: NebulaBlob[] = Array.from({ length: 5 }, (_, i) => ({
      x:      Math.random() * window.innerWidth,
      y:      Math.random() * window.innerHeight,
      radius: 200 + Math.random() * 300,
      r:      palettes[i][0],
      g:      palettes[i][1],
      b:      palettes[i][2],
      vx:     (Math.random() - 0.5) * 0.15,
      vy:     (Math.random() - 0.5) * 0.15,
      phase:  Math.random() * Math.PI * 2,
    }));

    const shooters: ShootingStar[] = [];
    let nextShooter = 120 + Math.random() * 180;

    const spawnShooter = () => {
      const side = Math.random();
      let sx = 0, sy = 0;
      if (side < 0.5) { sx = Math.random() * canvas.width; sy = 0; }
      else            { sx = 0; sy = Math.random() * canvas.height * 0.5; }
      const angle = (Math.PI / 6) + Math.random() * (Math.PI / 8);
      const speed = 6 + Math.random() * 6;
      shooters.push({
        x: sx, y: sy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 60 + Math.random() * 30,
        length: 80 + Math.random() * 120,
      });
    };

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;

      // Clear
      ctx.fillStyle = '#010008';
      ctx.fillRect(0, 0, W, H);

      // Nebulae
      for (const nb of nebulae) {
        nb.x += nb.vx;
        nb.y += nb.vy;
        nb.phase += 0.003;
        if (nb.x < -nb.radius)  nb.x = W + nb.radius;
        if (nb.x > W + nb.radius) nb.x = -nb.radius;
        if (nb.y < -nb.radius)  nb.y = H + nb.radius;
        if (nb.y > H + nb.radius) nb.y = -nb.radius;

        const pulse = 0.5 + 0.5 * Math.sin(nb.phase);
        const opacity = (0.03 + pulse * 0.04).toFixed(3);
        const r = Math.round(nb.r + pulse * 30);
        const g = Math.round(nb.g + pulse * 20);
        const b = Math.round(nb.b + pulse * 40);

        const grad = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.radius * (0.8 + pulse * 0.3));
        grad.addColorStop(0, `rgba(${r},${g},${b},${opacity})`);
        grad.addColorStop(0.4, `rgba(${Math.round(r*0.6)},${Math.round(g*0.6)},${Math.round(b*0.8)},${(+opacity * 0.6).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nb.x, nb.y, nb.radius * (0.8 + pulse * 0.3), 0, Math.PI * 2);
        ctx.fill();
      }

      // Stars
      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        const alpha = 0.3 + twinkle * 0.7;
        const sx = s.x * W;
        const sy = s.y * H;

        // Glow for brighter stars
        if (s.size > 1.6) {
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.size * 4);
          glow.addColorStop(0, `rgba(220,210,255,${(alpha * 0.5).toFixed(2)})`);
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(sx, sy, s.size * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(255,252,240,${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, s.size * twinkle, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shooting stars
      nextShooter--;
      if (nextShooter <= 0) { spawnShooter(); nextShooter = 180 + Math.random() * 300; }

      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        sh.x += sh.vx;
        sh.y += sh.vy;
        sh.life++;

        const progress = sh.life / sh.maxLife;
        const alpha = progress < 0.1 ? progress * 10 : progress > 0.7 ? (1 - progress) / 0.3 : 1;

        const tailX = sh.x - sh.vx * (sh.length / Math.hypot(sh.vx, sh.vy));
        const tailY = sh.y - sh.vy * (sh.length / Math.hypot(sh.vx, sh.vy));

        const trail = ctx.createLinearGradient(tailX, tailY, sh.x, sh.y);
        trail.addColorStop(0, 'rgba(255,255,255,0)');
        trail.addColorStop(0.6, `rgba(200,200,255,${(alpha * 0.4).toFixed(2)})`);
        trail.addColorStop(1, `rgba(255,255,255,${alpha.toFixed(2)})`);

        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(sh.x, sh.y);
        ctx.stroke();

        // Head glow
        const hg = ctx.createRadialGradient(sh.x, sh.y, 0, sh.x, sh.y, 6);
        hg.addColorStop(0, `rgba(255,255,255,${alpha.toFixed(2)})`);
        hg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(sh.x, sh.y, 6, 0, Math.PI * 2);
        ctx.fill();

        if (sh.life >= sh.maxLife) shooters.splice(i, 1);
      }

      t++;
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="cosmic-canvas" aria-hidden />;
}
