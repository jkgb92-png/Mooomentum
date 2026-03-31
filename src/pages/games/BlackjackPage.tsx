import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import WaveBackground from '../../components/WaveBackground';

type Suit = '♠' | '♣' | '♥' | '♦';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
interface Card { suit: Suit; rank: Rank; }

const SUITS: Suit[] = ['♠', '♣', '♥', '♦'];
const RANKS: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function createDeck(): Card[] {
  return SUITS.flatMap(suit => RANKS.map(rank => ({ suit, rank })));
}

function shuffle(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function cardValue(rank: Rank): number {
  if (['J','Q','K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank);
}

function handValue(hand: Card[]): number {
  let value = hand.reduce((sum, c) => sum + cardValue(c.rank), 0);
  let aces = hand.filter(c => c.rank === 'A').length;
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  return value;
}

function CardDisplay({ card, hidden }: { card: Card; hidden?: boolean }) {
  const isRed = card.suit === '♥' || card.suit === '♦';
  if (hidden) {
    return (
      <div className="card-playing bg-gradient-to-br from-ocean-700 to-ocean-900 border-ocean-500 text-2xl">
        🂠
      </div>
    );
  }
  return (
    <div className={`card-playing bg-white border-gray-300 ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
      <div className="text-sm leading-none">{card.rank}{card.suit}</div>
    </div>
  );
}

export default function BlackjackPage() {
  const { user, updateBalance, updateStats } = useAuth();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [bet, setBet] = useState(25);
  const [phase, setPhase] = useState<'bet' | 'play' | 'done'>('bet');
  const [message, setMessage] = useState('');
  const [dealerRevealed, setDealerRevealed] = useState(false);

  const startGame = () => {
    if (!user || user.balance < bet) return;
    const newDeck = shuffle([...createDeck(), ...createDeck()]);
    const p = [newDeck[0], newDeck[2]];
    const d = [newDeck[1], newDeck[3]];
    setDeck(newDeck.slice(4));
    setPlayerHand(p);
    setDealerHand(d);
    setPhase('play');
    setMessage('');
    setDealerRevealed(false);
    updateBalance(-bet);

    if (handValue(p) === 21) {
      setDealerRevealed(true);
      setPhase('done');
      const won = Math.floor(bet * 2.5);
      updateBalance(won);
      updateStats(true, won - bet);
      setMessage(`🎉 BLACKJACK! You win ${won - bet} credits!`);
    }
  };

  const hit = () => {
    if (phase !== 'play') return;
    const newCard = deck[0];
    const newDeck = deck.slice(1);
    const newHand = [...playerHand, newCard];
    setDeck(newDeck);
    setPlayerHand(newHand);
    if (handValue(newHand) > 21) {
      setDealerRevealed(true);
      setPhase('done');
      updateStats(false, 0);
      setMessage(`💥 Bust! You went over 21. Lost ${bet} credits.`);
    }
  };

  const stand = () => {
    if (phase !== 'play') return;
    setDealerRevealed(true);
    let dHand = [...dealerHand];
    let dDeck = [...deck];
    while (handValue(dHand) < 17) {
      dHand.push(dDeck[0]);
      dDeck = dDeck.slice(1);
    }
    setDealerHand(dHand);
    setDeck(dDeck);
    setPhase('done');
    
    const pv = handValue(playerHand);
    const dv = handValue(dHand);
    if (dv > 21 || pv > dv) {
      const won = bet * 2;
      updateBalance(won);
      updateStats(true, bet);
      setMessage(`🎉 You win! ${pv} vs ${dv}. +${bet} credits!`);
    } else if (pv === dv) {
      updateBalance(bet);
      setMessage(`🤝 Push! Bet returned.`);
    } else {
      updateStats(false, 0);
      setMessage(`😢 Dealer wins. ${pv} vs ${dv}. -${bet} credits.`);
    }
  };

  const double = () => {
    if (phase !== 'play' || !user || user.balance < bet) return;
    updateBalance(-bet);
    const newBet = bet * 2;
    setBet(newBet);
    const newCard = deck[0];
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    const deckAfterHit = deck.slice(1);
    if (handValue(newHand) > 21) {
      setDealerRevealed(true);
      setPhase('done');
      updateStats(false, 0);
      setMessage(`💥 Bust after double! Lost ${newBet} credits.`);
    } else {
      setDealerRevealed(true);
      let dHand = [...dealerHand];
      let dDeck = [...deckAfterHit];
      while (handValue(dHand) < 17) {
        dHand.push(dDeck[0]);
        dDeck = dDeck.slice(1);
      }
      setDealerHand(dHand);
      setDeck(dDeck);
      setPhase('done');
      const pv = handValue(newHand);
      const dv = handValue(dHand);
      if (dv > 21 || pv > dv) {
        const won = newBet * 2;
        updateBalance(won);
        updateStats(true, newBet);
        setMessage(`🎉 You win! ${pv} vs ${dv}. +${newBet} credits!`);
      } else if (pv === dv) {
        updateBalance(newBet);
        setMessage(`🤝 Push! Bet returned.`);
      } else {
        updateStats(false, 0);
        setMessage(`😢 Dealer wins. ${pv} vs ${dv}. -${newBet} credits.`);
      }
    }
  };

  return (
    <div className="min-h-screen">
      <WaveBackground />
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/lobby')} className="text-ocean-400 hover:text-white mb-6 flex items-center gap-2">
          ← Back to Lobby
        </button>
        <div className="glass-card p-8">
          <h1 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-6">
            🃏 Blackjack
          </h1>

          <div className="mb-6">
            <h3 className="text-ocean-300 mb-2">
              Dealer {dealerRevealed && `(${handValue(dealerHand)})`}
            </h3>
            <div className="flex gap-2 flex-wrap">
              {dealerHand.map((card, i) => (
                <CardDisplay key={i} card={card} hidden={!dealerRevealed && i === 1} />
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 my-4" />

          <div className="mb-6">
            <h3 className="text-ocean-300 mb-2">
              Your Hand ({handValue(playerHand)})
            </h3>
            <div className="flex gap-2 flex-wrap">
              {playerHand.map((card, i) => <CardDisplay key={i} card={card} />)}
            </div>
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded-xl font-bold text-center ${message.includes('win') || message.includes('BLACKJACK') ? 'bg-green-500/20 text-green-300' : message.includes('Push') ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
              {message}
            </div>
          )}

          {phase === 'bet' && (
            <div className="text-center">
              <p className="text-ocean-300 mb-4">Select your bet:</p>
              <div className="flex justify-center gap-3 mb-6">
                {[10, 25, 50, 100, 250].map(b => (
                  <button
                    key={b}
                    onClick={() => setBet(b)}
                    className={`px-4 py-2 rounded-lg font-bold ${bet === b ? 'bg-gold-500 text-black' : 'glass-card text-ocean-300'}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <button onClick={startGame} disabled={!user || user.balance < bet} className="gold-btn text-xl px-12">
                🃏 Deal Cards (Bet: {bet})
              </button>
            </div>
          )}

          {phase === 'play' && (
            <div className="flex justify-center gap-4">
              <button onClick={hit} className="ocean-btn">🃏 Hit</button>
              <button onClick={stand} className="gold-btn">✋ Stand</button>
              {playerHand.length === 2 && user && user.balance >= bet && (
                <button onClick={double} className="bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold py-3 px-6 rounded-xl">⚡ Double</button>
              )}
            </div>
          )}

          {phase === 'done' && (
            <div className="text-center">
              <button onClick={() => { setPhase('bet'); setPlayerHand([]); setDealerHand([]); setBet(25); }} className="gold-btn text-xl px-12">
                🔄 New Game
              </button>
            </div>
          )}

          <p className="text-center text-ocean-400 mt-4">Balance: 💰 {user?.balance.toLocaleString()}</p>
        </div>
      </main>
    </div>
  );
}
