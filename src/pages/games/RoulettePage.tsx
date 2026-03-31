import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import WaveBackground from '../../components/WaveBackground';

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BETS = [
  { label: 'Red', emoji: '🔴', check: (n: number) => RED_NUMBERS.includes(n), payout: 2 },
  { label: 'Black', emoji: '⚫', check: (n: number) => n > 0 && !RED_NUMBERS.includes(n), payout: 2 },
  { label: 'Even', emoji: '2️⃣', check: (n: number) => n > 0 && n % 2 === 0, payout: 2 },
  { label: 'Odd', emoji: '1️⃣', check: (n: number) => n > 0 && n % 2 !== 0, payout: 2 },
  { label: '1-12', emoji: '🎯', check: (n: number) => n >= 1 && n <= 12, payout: 3 },
  { label: '13-24', emoji: '🎯', check: (n: number) => n >= 13 && n <= 24, payout: 3 },
  { label: '25-36', emoji: '🎯', check: (n: number) => n >= 25 && n <= 36, payout: 3 },
  { label: '0 (Green)', emoji: '💚', check: (n: number) => n === 0, payout: 36 },
];

export default function RoulettePage() {
  const { user, updateBalance, updateStats } = useAuth();
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [selectedBet, setSelectedBet] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<number[]>([]);

  const spin = useCallback(() => {
    if (!user || spinning || user.balance < betAmount) return;
    updateBalance(-betAmount);
    setSpinning(true);
    setMessage('');

    const target = Math.floor(Math.random() * 37);

    setTimeout(() => {
      setResult(target);
      setSpinning(false);
      setHistory(prev => [target, ...prev.slice(0, 9)]);

      const betDef = BETS[selectedBet];
      if (betDef.check(target)) {
        const won = betAmount * betDef.payout;
        updateBalance(won);
        updateStats(true, won - betAmount);
        setMessage(`🎉 ${target}! ${betDef.label} wins! +${won - betAmount} credits!`);
      } else {
        updateStats(false, 0);
        setMessage(`😢 ${target} (${RED_NUMBERS.includes(target) ? '🔴' : target === 0 ? '💚' : '⚫'}) - You lost ${betAmount} credits.`);
      }
    }, 3000);
  }, [user, spinning, betAmount, selectedBet, updateBalance, updateStats]);

  const isRed = (n: number) => RED_NUMBERS.includes(n);
  const numColor = (n: number) => n === 0 ? 'text-green-400' : isRed(n) ? 'text-red-400' : 'text-gray-300';

  return (
    <div className="min-h-screen">
      <WaveBackground />
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/lobby')} className="text-ocean-400 hover:text-white mb-6">← Back to Lobby</button>
        <div className="glass-card p-8">
          <h1 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 mb-6">
            🎡 Wave Roulette
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div
                className={`w-48 h-48 rounded-full mx-auto border-4 border-ocean-400 flex items-center justify-center relative overflow-hidden ${spinning ? 'animate-spin' : ''}`}
                style={{
                  background: 'conic-gradient(#dc2626 0deg, #1a1a1a 9.7deg, #dc2626 19.4deg, #1a1a1a 29.1deg, #dc2626 38.8deg, #1a1a1a 48.5deg, #dc2626 58.2deg, #1a1a1a 67.9deg, #dc2626 77.6deg, #1a1a1a 87.3deg, #16a34a 97deg, #dc2626 106.7deg, #1a1a1a 116.4deg, #dc2626 126.1deg, #1a1a1a 135.8deg, #dc2626 145.5deg, #1a1a1a 155.2deg, #dc2626 164.9deg, #1a1a1a 174.6deg, #dc2626 184.3deg, #1a1a1a 194deg, #dc2626 203.7deg, #1a1a1a 213.4deg, #dc2626 223.1deg, #1a1a1a 232.8deg, #dc2626 242.5deg, #1a1a1a 252.2deg, #dc2626 261.9deg, #1a1a1a 271.6deg, #dc2626 281.3deg, #1a1a1a 291deg, #dc2626 300.7deg, #1a1a1a 310.4deg, #dc2626 320.1deg, #1a1a1a 329.8deg, #dc2626 339.5deg, #1a1a1a 349.2deg, #dc2626 358.9deg)',
                }}
              >
                <div className="glass-card w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black z-10">
                  {result !== null ? <span className={numColor(result)}>{result}</span> : '🎡'}
                </div>
              </div>
              {result !== null && !spinning && (
                <p className={`mt-4 text-3xl font-black ${numColor(result)}`}>
                  {result} {result === 0 ? '💚' : isRed(result) ? '🔴' : '⚫'}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-ocean-300 font-bold mb-3">Select Bet Type:</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {BETS.map((bet, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedBet(i)}
                    className={`p-3 rounded-xl text-sm font-bold transition-all ${selectedBet === i ? 'bg-gold-500 text-black' : 'glass-card text-ocean-300 hover:text-white'}`}
                  >
                    {bet.emoji} {bet.label} ({bet.payout}x)
                  </button>
                ))}
              </div>

              <h3 className="text-ocean-300 font-bold mb-2">Bet Amount:</h3>
              <div className="flex gap-2 mb-4">
                {[10, 25, 50, 100].map(b => (
                  <button key={b} onClick={() => setBetAmount(b)}
                    className={`px-3 py-2 rounded-lg font-bold text-sm ${betAmount === b ? 'bg-gold-500 text-black' : 'glass-card text-ocean-300'}`}
                  >{b}</button>
                ))}
              </div>

              <button onClick={spin} disabled={spinning || !user || (user?.balance ?? 0) < betAmount}
                className="w-full gold-btn text-xl disabled:opacity-50">
                {spinning ? '🌀 Spinning...' : `🎡 Spin! (Bet: ${betAmount})`}
              </button>
            </div>
          </div>

          {message && (
            <div className={`mt-6 p-4 rounded-xl font-bold text-center ${message.includes('wins') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
              {message}
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-ocean-300 mb-2">Number Board</h3>
            <div className="flex flex-wrap gap-1">
              {[0, ...Array.from({length: 36}, (_, i) => i + 1)].map(n => (
                <div key={n} className={`w-8 h-8 rounded text-xs font-bold flex items-center justify-center
                  ${n === 0 ? 'bg-green-700' : isRed(n) ? 'bg-red-700' : 'bg-gray-800'}
                  ${result === n ? 'ring-2 ring-gold-400 scale-110' : ''}
                `}>{n}</div>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="mt-4">
              <h3 className="text-ocean-300 text-sm mb-1">History:</h3>
              <div className="flex gap-2">
                {history.map((n, i) => (
                  <span key={i} className={`text-sm font-bold ${numColor(n)}`}>{n}</span>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-ocean-400 mt-4">Balance: 💰 {user?.balance.toLocaleString()}</p>
        </div>
      </main>
    </div>
  );
}
