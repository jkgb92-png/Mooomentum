import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { balance } = useGame();
  const isLobby = location.pathname === '/';

  return (
    <header className="header">
      <span
        className="header-logo"
        onClick={() => navigate('/')}
        role="link"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && navigate('/')}
        aria-label="Mooomentum Casino home"
      >
        MOOOMENTUM
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {!isLobby && (
          <button
            className="btn btn-ghost"
            style={{ padding: '7px 16px', fontSize: '0.7rem' }}
            onClick={() => navigate('/')}
          >
            ← Lobby
          </button>
        )}
        <div className="header-balance">
          <span className="header-balance-icon">💰</span>
          <span>${balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
        </div>
      </div>
    </header>
  );
}
