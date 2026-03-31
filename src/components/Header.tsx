import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-ocean-500/20 mx-0 rounded-none px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/lobby" className="flex items-center gap-3">
          <span className="text-3xl animate-float inline-block">🌊</span>
          <div>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-ocean-300 to-gold-400 glow-text">
              WaveCasino
            </h1>
            <p className="text-xs text-ocean-400">Ride the Wave of Fortune</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/lobby" className="text-ocean-300 hover:text-white transition-colors font-medium">🎮 Games</Link>
          <Link to="/leaderboard" className="text-ocean-300 hover:text-white transition-colors font-medium">🏆 Leaderboard</Link>
          {user?.isAdmin && (
            <Link to="/admin" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">👑 Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user && (
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <span className="text-xl">{user.avatar}</span>
              <div>
                <p className="text-xs text-ocean-400">{user.username}</p>
                <p className="text-sm font-bold text-gold-400">
                  💰 {user.balance.toLocaleString()}
                </p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="ocean-btn text-sm py-2">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
