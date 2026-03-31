import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import WaveBackground from '../components/WaveBackground';

const GAMES = [
  {
    id: 'slots',
    name: 'Ocean Slots',
    emoji: '🎰',
    description: 'Spin the reels & hit the jackpot!',
    color: 'from-purple-600 to-purple-900',
    badge: '🔥 HOT',
    minBet: 10,
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    emoji: '🃏',
    description: 'Beat the dealer to 21!',
    color: 'from-green-700 to-emerald-900',
    badge: '⭐ Classic',
    minBet: 25,
  },
  {
    id: 'roulette',
    name: 'Roulette',
    emoji: '🎡',
    description: 'Spin the wheel of fortune!',
    color: 'from-red-700 to-rose-900',
    badge: '🌊 Wave',
    minBet: 10,
  },
  {
    id: 'poker',
    name: 'Video Poker',
    emoji: '♠️',
    description: 'Jacks or Better - hold your best hand!',
    color: 'from-blue-700 to-indigo-900',
    badge: '💎 Premium',
    minBet: 20,
  },
];

export default function LobbyPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <WaveBackground />
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="glass-card p-6 mb-8 text-center relative overflow-hidden">
          <div className="shimmer absolute inset-0 pointer-events-none" />
          <h2 className="text-3xl font-black text-white mb-2">
            Welcome back, <span className="text-gold-400">{user?.avatar} {user?.username}</span>!
          </h2>
          <p className="text-ocean-300 text-lg">
            Your balance: <span className="text-gold-400 font-bold text-2xl">💰 {user?.balance.toLocaleString()}</span> credits
          </p>
          <div className="flex justify-center gap-8 mt-4 text-sm text-ocean-400">
            <span>🎮 {user?.gamesPlayed} games played</span>
            <span>🏆 {user?.totalWinnings.toLocaleString()} credits won</span>
          </div>
        </div>

        <div className="glass-card p-4 mb-8 bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-yellow-500/30 text-center">
          <p className="text-gold-400 font-bold text-xl animate-pulse">
            🏆 MEGA JACKPOT: 💰 2,500,000 CREDITS 🏆
          </p>
        </div>

        <h3 className="text-xl font-bold text-ocean-300 mb-4">🎮 Choose Your Game</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {GAMES.map(game => (
            <Link
              key={game.id}
              to={`/game/${game.id}`}
              className="glass-card group hover:scale-105 transition-all duration-300 overflow-hidden cursor-pointer"
            >
              <div className={`bg-gradient-to-br ${game.color} p-6 relative`}>
                <div className="text-6xl text-center mb-2 group-hover:animate-float inline-block w-full">
                  {game.emoji}
                </div>
                <span className="absolute top-3 right-3 text-xs glass-card px-2 py-1 text-gold-400 font-bold">
                  {game.badge}
                </span>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-white text-lg">{game.name}</h4>
                <p className="text-ocean-400 text-sm mb-2">{game.description}</p>
                <p className="text-gold-400 text-xs">Min bet: 💰 {game.minBet}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Players Online', value: '1,247', emoji: '👥' },
            { label: 'Games Today', value: '48,392', emoji: '🎮' },
            { label: 'Total Paid Out', value: '₿ 2.4M', emoji: '💸' },
          ].map(stat => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <div className="text-2xl mb-1">{stat.emoji}</div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-ocean-400 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
