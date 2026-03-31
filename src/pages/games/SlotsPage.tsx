import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import WaveBackground from '../../components/WaveBackground';

const SYMBOLS = ['🌊', '🐬', '🦈', '🐙', '💎', '⭐', '🌟', '🎰', '🍀', '💰'];
const PAYOUTS: Record<string, number> = {
  '💎💎💎': 500, '🌟🌟🌟': 200, '💰💰💰': 150,
  '🍀🍀🍀': 100, '🦈🦈🦈': 75, '🐙🐙🐙': 50,
  '🐬🐬🐬': 40, '🌊🌊🌊': 30, '⭐⭐⭐': 25, '🎰🎰🎰': 20,
};

function randomSymbol() { return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; }

export default function SlotsPage() {
  const { user, updateBalance, updateStats } = useAuth();
  const navigate = useNavigate();
  const [reels, setReels] = useState(['🌊', '🌊', '🌊']);
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(10);
  const [message, setMessage] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  const spin = useCallback(() => {
    if (!user || spinning || user.balance < bet) return;
    updateBalance(-bet);
    setSpinning(true);
    setMessage('');
    setWinAmount(0);

    let ticks = 0;
    const maxTicks = 20;
    const interval = setInterval(() => {
      ticks++;
      setReels([randomSymbol(), randomSymbol(), randomSymbol()]);
      if (ticks >= maxTicks) {
        clearInterval(interval);
        const final = [randomSymbol(), randomSymbol(), randomSymbol()];
        setReels(final);
        setSpinning(false);
        
        const combo = final.join('');
        const payout = PAYOUTS[combo];
        if (payout) {
          const won = bet * payout / 10;
          updateBalance(won);
          updateStats(true, won);
          setWinAmount(won);
          setMessage(`🎉 ${combo} - You won ${won} credits!`);
          setHistory(prev => [`🏆 +${won} (${combo})`, ...prev.slice(0, 4)]);
        } else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) {
          const won = Math.floor(bet * 0.5);
          updateBalance(won);
          updateStats(true, won);
          setWinAmount(won);
          setMessage(`✨ Partial match! +${won} credits`);
          setHistory(prev => [`✨ +${won}`, ...prev.slice(0, 4)]);
        } else {
          updateStats(false, 0);
          setMessage(`😢 No match. Try again!`);
          setHistory(prev => [`💸 -${bet}`, ...prev.slice(0, 4)]);
        }
      }
    }, 80);
  }, [user, spinning, bet, updateBalance, updateStats]);

  return (
    <div className="min-h-screen">
      <WaveBackground />
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/lobby')} className="text-ocean-400 hover:text-white mb-6 flex items-center gap-2">
          ← Back to Lobby
        </button>

        <div className="glass-card p-8 text-center">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
            🎰 Ocean Slots
          </h1>
          <p className="text-ocean-400 mb-6">Spin the deep sea reels!</p>

          <div className="flex justify-center gap-4 mb-8">
            {reels.map((sym, i) => (
              <div
                key={i}
                className={`slot-reel text-5xl ${spinning ? 'animate-spin-slow opacity-70' : ''} ${winAmount > 0 ? 'border-gold-400 shadow-gold-400/30 shadow-lg' : ''}`}
              >
                {sym}
              </div>
            ))}
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl font-bold text-xl ${winAmount > 0 ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/10 text-red-300'}`}>
              {message}
            </div>
          )}

          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-ocean-300">Bet:</span>
            {[10, 25, 50, 100].map(b => (
              <button
                key={b}
                onClick={() => setBet(b)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${bet === b ? 'bg-gold-500 text-black' : 'glass-card text-ocean-300 hover:text-white'}`}
              >
                {b}
              </button>
            ))}
          </div>

          <button
            onClick={spin}
            disabled={spinning || !user || (user?.balance ?? 0) < bet}
            className="gold-btn text-2xl px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {spinning ? '🌀 Spinning...' : '🎰 SPIN!'}
          </button>

          <p className="text-ocean-400 mt-4">Balance: 💰 {user?.balance.toLocaleString()}</p>

          <div className="mt-8 grid grid-cols-2 gap-2 text-sm">
            <h3 className="col-span-2 text-ocean-300 font-bold mb-2">💎 Paytable (multiplier × bet/10)</h3>
            {Object.entries(PAYOUTS).map(([combo, mult]) => (
              <div key={combo} className="glass-card px-3 py-2 flex justify-between">
                <span>{combo}</span>
                <span className="text-gold-400">×{mult}</span>
              </div>
            ))}
          </div>

          {history.length > 0 && (
            <div className="mt-6 glass-card p-4">
              <h3 className="text-ocean-300 font-bold mb-2">Recent Results</h3>
              {history.map((h, i) => (
                <p key={i} className="text-sm text-ocean-400">{h}</p>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
