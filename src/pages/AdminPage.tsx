import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import WaveBackground from '../components/WaveBackground';

export default function AdminPage() {
  const { users, user } = useAuth();
  const [tab, setTab] = useState<'players' | 'stats'>('players');

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <WaveBackground />
        <div className="glass-card p-8 text-center">
          <p className="text-red-400 text-xl">⛔ Access Denied</p>
        </div>
      </div>
    );
  }

  const players = users.filter(u => !u.isAdmin);
  const totalBalance = players.reduce((s, u) => s + u.balance, 0);
  const totalGames = players.reduce((s, u) => s + u.gamesPlayed, 0);
  const totalWinnings = players.reduce((s, u) => s + u.totalWinnings, 0);

  return (
    <div className="min-h-screen">
      <WaveBackground />
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="glass-card p-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-yellow-300 mb-6">
            👑 Admin Dashboard
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Players', value: players.length, emoji: '👥' },
              { label: 'Total Credits', value: totalBalance.toLocaleString(), emoji: '💰' },
              { label: 'Games Played', value: totalGames.toLocaleString(), emoji: '🎮' },
              { label: 'Total Winnings', value: totalWinnings.toLocaleString(), emoji: '🏆' },
            ].map(stat => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <div className="text-2xl">{stat.emoji}</div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-ocean-400">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-6 glass-card p-1 w-fit">
            {(['players', 'stats'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl font-bold transition-all capitalize ${tab === t ? 'bg-ocean-600 text-white' : 'text-ocean-400 hover:text-white'}`}>
                {t === 'players' ? '👥 Players' : '📊 Stats'}
              </button>
            ))}
          </div>

          {tab === 'players' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ocean-400 border-b border-white/10">
                    <th className="text-left py-2 px-3">Avatar</th>
                    <th className="text-left py-2 px-3">Username</th>
                    <th className="text-left py-2 px-3">Email</th>
                    <th className="text-right py-2 px-3">Balance</th>
                    <th className="text-right py-2 px-3">Games</th>
                    <th className="text-right py-2 px-3">Winnings</th>
                    <th className="text-left py-2 px-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2 px-3 text-xl">{p.avatar}</td>
                      <td className="py-2 px-3 text-white font-medium">{p.username}</td>
                      <td className="py-2 px-3 text-ocean-400">{p.email}</td>
                      <td className="py-2 px-3 text-right text-gold-400 font-bold">💰 {p.balance.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-ocean-300">{p.gamesPlayed}</td>
                      <td className="py-2 px-3 text-right text-green-400">{p.totalWinnings.toLocaleString()}</td>
                      <td className="py-2 px-3 text-ocean-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {players.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-ocean-400">No players yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'stats' && (
            <div className="space-y-4">
              <div className="glass-card p-4">
                <h3 className="text-ocean-300 font-bold mb-3">Top Earners</h3>
                {[...players].sort((a, b) => b.totalWinnings - a.totalWinnings).slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-white/5">
                    <span className="text-xl">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                    <span>{p.avatar} {p.username}</span>
                    <span className="ml-auto text-gold-400 font-bold">+{p.totalWinnings.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="glass-card p-4">
                <h3 className="text-ocean-300 font-bold mb-2">Casino Health</h3>
                <p className="text-ocean-400 text-sm">House edge maintained at optimal levels. All games operating normally.</p>
                <div className="mt-3 flex gap-3 flex-wrap">
                  <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">✅ Slots Online</span>
                  <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">✅ Blackjack Online</span>
                  <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">✅ Roulette Online</span>
                  <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">✅ Poker Online</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
