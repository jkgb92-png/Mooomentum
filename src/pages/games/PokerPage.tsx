import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import WaveBackground from '../../components/WaveBackground';

type Suit = '♠' | '♣' | '♥' | '♦';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
interface Card { suit: Suit; rank: Rank; held: boolean; }

const SUITS: Suit[] = ['♠', '♣', '♥', '♦'];
const RANKS: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RANK_VALUE: Record<Rank, number> = { A: 14, K: 13, Q: 12, J: 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };

function createDeck(): Card[] {
  return SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank, held: false })));
}

function shuffle(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function evaluateHand(cards: Card[]): { name: string; payout: number } {
  const values = cards.map(c => RANK_VALUE[c.rank]).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const counts: Record<number, number> = {};
  values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  const countVals = Object.values(counts).sort((a, b) => b - a);
  const isFlush = new Set(suits).size === 1;
  const isStraight = values[0] - values[4] === 4 && new Set(values).size === 5;
  const isRoyalFlush = isFlush && isStraight && values[0] === 14;
  const isAceLowStraight = new Set(values).size === 5 && values[0] === 14 && values[1] === 5;

  if (isRoyalFlush) return { name: '👑 Royal Flush!', payout: 800 };
  if (isFlush && (isStraight || isAceLowStraight)) return { name: '🌟 Straight Flush!', payout: 50 };
  if (countVals[0] === 4) return { name: '💎 Four of a Kind!', payout: 25 };
  if (countVals[0] === 3 && countVals[1] === 2) return { name: '🏠 Full House!', payout: 9 };
  if (isFlush) return { name: '🌊 Flush!', payout: 6 };
  if (isStraight || isAceLowStraight) return { name: '📈 Straight!', payout: 4 };
  if (countVals[0] === 3) return { name: '🎲 Three of a Kind!', payout: 3 };
  if (countVals[0] === 2 && countVals[1] === 2) return { name: '✌️ Two Pair!', payout: 2 };
  const pairValue = values.find(v => counts[v] === 2);
  if (countVals[0] === 2 && pairValue !== undefined && pairValue >= 11) {
    return { name: '🎴 Jacks or Better!', payout: 1 };
  }
  return { name: '😢 No Win', payout: 0 };
}

function CardDisplay({ card, onClick, phase }: { card: Card; onClick?: () => void; phase: string }) {
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <button
      onClick={onClick}
      disabled={phase !== 'hold'}
      className={`card-playing transition-all duration-200 ${
        isRed ? 'bg-white text-red-600 border-red-300' : 'bg-white text-gray-900 border-gray-300'
      } ${card.held ? 'ring-2 ring-gold-400 -translate-y-3 shadow-gold-400/30 shadow-lg' : ''}
      ${phase === 'hold' ? 'hover:-translate-y-1 cursor-pointer' : ''}`}
    >
      <div className="text-xs">{card.rank}{card.suit}</div>
    </button>
  );
}

export default function PokerPage() {
  const { user, updateBalance, updateStats } = useAuth();
  const navigate = useNavigate();
  const [hand, setHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [phase, setPhase] = useState<'bet' | 'hold' | 'result'>('bet');
  const [bet, setBet] = useState(20);
  const [message, setMessage] = useState('');
  const [payout, setPayout] = useState(0);

  const deal = () => {
    if (!user || user.balance < bet) return;
    updateBalance(-bet);
    const newDeck = shuffle(createDeck());
    setHand(newDeck.slice(0, 5));
    setDeck(newDeck.slice(5));
    setPhase('hold');
    setMessage('Select cards to hold, then draw!');
    setPayout(0);
  };

  const toggleHold = (i: number) => {
    if (phase !== 'hold') return;
    setHand(prev => prev.map((c, idx) => idx === i ? { ...c, held: !c.held } : c));
  };

  const draw = () => {
    if (phase !== 'hold') return;
    let deckCopy = [...deck];
    const newHand = hand.map(c => {
      if (!c.held) {
        const newCard = { ...deckCopy[0], held: false };
        deckCopy = deckCopy.slice(1);
        return newCard;
      }
      return c;
    });
    setDeck(deckCopy);
    setHand(newHand);
    setPhase('result');

    const result = evaluateHand(newHand);
    if (result.payout > 0) {
      const won = bet * result.payout;
      updateBalance(won);
      updateStats(true, won - bet);
      setPayout(won);
      setMessage(`${result.name} - Won ${won} credits!`);
    } else {
      updateStats(false, 0);
      setMessage(`${result.name} - Lost ${bet} credits.`);
    }
  };

  const PAYTABLE = [
    { hand: '👑 Royal Flush', payout: 800 },
    { hand: '🌟 Straight Flush', payout: 50 },
    { hand: '💎 Four of a Kind', payout: 25 },
    { hand: '🏠 Full House', payout: 9 },
    { hand: '🌊 Flush', payout: 6 },
    { hand: '📈 Straight', payout: 4 },
    { hand: '🎲 Three of a Kind', payout: 3 },
    { hand: '✌️ Two Pair', payout: 2 },
    { hand: '🎴 Jacks or Better', payout: 1 },
  ];

  return (
    <div className="min-h-screen">
      <WaveBackground />
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/lobby')} className="text-ocean-400 hover:text-white mb-6">← Back to Lobby</button>
        <div className="glass-card p-8">
          <h1 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-6">
            ♠️ Video Poker - Jacks or Better
          </h1>

          <div className="flex justify-center gap-3 mb-6 min-h-28">
            {hand.map((card, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <CardDisplay card={card} onClick={() => toggleHold(i)} phase={phase} />
                {phase === 'hold' && (
                  <span className={`text-xs font-bold ${card.held ? 'text-gold-400' : 'text-ocean-500'}`}>
                    {card.held ? 'HELD' : 'click'}
                  </span>
                )}
              </div>
            ))}
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded-xl font-bold text-center text-lg ${payout > 0 ? 'bg-green-500/20 text-green-300' : phase === 'hold' ? 'bg-ocean-900/50 text-ocean-300' : 'bg-red-500/10 text-red-300'}`}>
              {message}
            </div>
          )}

          <div className="text-center">
            {phase === 'bet' && (
              <div>
                <div className="flex justify-center gap-3 mb-4">
                  {[10, 20, 50, 100].map(b => (
                    <button key={b} onClick={() => setBet(b)}
                      className={`px-4 py-2 rounded-lg font-bold ${bet === b ? 'bg-gold-500 text-black' : 'glass-card text-ocean-300'}`}>
                      {b}
                    </button>
                  ))}
                </div>
                <button onClick={deal} disabled={!user || user.balance < bet} className="gold-btn text-xl px-12">
                  🃏 Deal (Bet: {bet})
                </button>
              </div>
            )}

            {phase === 'hold' && (
              <button onClick={draw} className="gold-btn text-xl px-12">🎲 Draw Cards</button>
            )}

            {phase === 'result' && (
              <button onClick={() => { setPhase('bet'); setHand([]); setBet(20); }} className="gold-btn text-xl px-12">
                🔄 New Hand
              </button>
            )}
          </div>

          <p className="text-center text-ocean-400 mt-4">Balance: 💰 {user?.balance.toLocaleString()}</p>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            <h3 className="col-span-full text-ocean-300 font-bold mb-2">💰 Paytable (per coin bet)</h3>
            {PAYTABLE.map(({ hand, payout }) => (
              <div key={hand} className="glass-card px-3 py-2 flex justify-between">
                <span className="text-xs">{hand}</span>
                <span className="text-gold-400 font-bold">{payout}x</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
