import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import WaveBackground from '../components/WaveBackground';

export default function LeaderboardPage() {
  const { users } = useAuth();
  const sorted = [...users]
    .filter(u => !u.isAdmin)
    .sort((a, b) => b.totalWinnings - a.totalWinnings);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen">
      <WaveBackground />
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="glass-card p-8">
          <h1 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-yellow-300 mb-8">
            🏆 Leaderboard
          </h1>

          {sorted.length === 0 ? (
            <p className="text-center text-ocean-400">No players yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {sorted.map((player, i) => (
                <div key={player.id} className={`glass-card p-4 flex items-center gap-4 ${i === 0 ? 'border-gold-400/50 bg-gold-500/5' : ''}`}>
                  <span className="text-2xl w-8">{medals[i] || `${i + 1}.`}</span>
                  <span className="text-2xl">{player.avatar}</span>
                  <div className="flex-1">
                    <p className="font-bold text-white">{player.username}</p>
                    <p className="text-xs text-ocean-400">{player.gamesPlayed} games played</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gold-400 font-bold">💰 {player.totalWinnings.toLocaleString()}</p>
                    <p className="text-xs text-ocean-400">Balance: {player.balance.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
