import { useNavigate } from 'react-router-dom';
import CosmicBackground from '../components/CosmicBackground';
import Header from '../components/Header';

const GAMES = [
  {
    path: '/slots',
    icon: '🎰',
    name: 'Cosmic Slots',
    desc: 'Five spinning reels, infinite constellations of symbols. Hit the jackpot and watch the universe explode.',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.35)',
    badge: 'HOT',
    badgeBg: 'rgba(239,68,68,0.2)',
    badgeColor: '#f87171',
    bg: 'linear-gradient(160deg, rgba(60,20,120,0.5) 0%, rgba(15,5,40,0.7) 100%)',
  },
  {
    path: '/blackjack',
    icon: '🃏',
    name: 'Blackjack',
    desc: 'Holographic cards, 3D flips, and pure strategy. Beat the dealer and claim the neon throne.',
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.35)',
    badge: 'CLASSIC',
    badgeBg: 'rgba(6,182,212,0.15)',
    badgeColor: '#22d3ee',
    bg: 'linear-gradient(160deg, rgba(5,50,80,0.5) 0%, rgba(2,15,30,0.7) 100%)',
  },
  {
    path: '/roulette',
    icon: '🎡',
    name: 'Roulette',
    desc: 'A real spinning wheel rendered in the cosmos. Place your bets and let the ball decide your fate.',
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.35)',
    badge: 'LIVE',
    badgeBg: 'rgba(236,72,153,0.15)',
    badgeColor: '#f472b6',
    bg: 'linear-gradient(160deg, rgba(80,10,50,0.5) 0%, rgba(25,5,20,0.7) 100%)',
  },
  {
    path: '/crash',
    icon: '🚀',
    name: 'Crash',
    desc: 'Watch the multiplier soar into the void. Cash out before the explosion — or lose it all.',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.35)',
    badge: 'NEW',
    badgeBg: 'rgba(245,158,11,0.15)',
    badgeColor: '#fbbf24',
    bg: 'linear-gradient(160deg, rgba(80,40,0,0.5) 0%, rgba(25,10,0,0.7) 100%)',
  },
];

export default function LobbyPage() {
  const navigate = useNavigate();

  return (
    <>
      <CosmicBackground />
      <Header />

      <div className="page-wrapper" style={{ zIndex: 1 }}>
        <div
          style={{
            minHeight: '100vh',
            paddingTop: '100px',
            paddingBottom: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: '56px', padding: '0 24px' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '16px',
                animation: 'fade-in 0.6s ease',
              }}
            >
              ✦ Welcome to ✦
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.4rem, 7vw, 5rem)',
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 40%, #fbbf24 70%, #f472b6 100%)',
                backgroundSize: '300% 300%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'holographic 5s ease infinite, slide-down 0.5s ease',
                lineHeight: 1.1,
                marginBottom: '16px',
              }}
            >
              MOOOMENTUM
            </h1>
            <p
              style={{
                color: 'var(--text-dim)',
                fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                animation: 'fade-in 0.8s 0.2s ease both',
              }}
            >
              Casino · Next Dimension
            </p>
          </div>

          {/* Balance Banner */}
          <div
            style={{
              marginBottom: '48px',
              padding: '14px 40px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))',
              border: '1px solid rgba(245,158,11,0.25)',
              backdropFilter: 'blur(12px)',
              animation: 'slide-up 0.5s 0.3s ease both',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.3em', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
              Your Balance
            </div>
            <div className="text-glow-gold" style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--gold-light)' }}>
              $1,000
            </div>
          </div>

          {/* Game Cards Grid */}
          <div className="lobby-grid">
            {GAMES.map(game => (
              <div
                key={game.path}
                className="game-card"
                style={{
                  background: game.bg,
                  '--accent-color': game.color,
                  '--accent-glow': game.glow,
                } as React.CSSProperties}
                onClick={() => navigate(game.path)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(game.path)}
                aria-label={`Play ${game.name}`}
              >
                {/* Badge */}
                <div
                  className="game-card-badge"
                  style={{ background: game.badgeBg, color: game.badgeColor, border: `1px solid ${game.color}40` }}
                >
                  {game.badge}
                </div>

                <span className="game-card-icon">{game.icon}</span>
                <div className="game-card-name" style={{ color: game.color }}>{game.name}</div>
                <p className="game-card-desc">{game.desc}</p>

                <div
                  style={{
                    marginTop: '24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-display)',
                    color: game.color,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Play Now →
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
