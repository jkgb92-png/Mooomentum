import { useState, useCallback, useRef } from 'react';
import CosmicBackground from '../../components/CosmicBackground';
import Header from '../../components/Header';
import PlayingCard from '../../components/PlayingCard';
import ParticleSystem from '../../components/ParticleSystem';
import { useGame } from '../../contexts/GameContext';
import { Card } from '../../types';

// ── Deck ──────────────────────────────────────────────────────────────────
const SUITS: Card['suit'][] = ['♠', '♣', '♥', '♦'];
const RANKS: Card['rank'][] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ suit, rank, faceUp: true, id: `${rank}${suit}${Math.random()}` });
  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardValue(rank: Card['rank']): number {
  if (['J','Q','K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank, 10);
}

function handTotal(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (!c.faceUp) continue;
    total += cardValue(c.rank);
    if (c.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function isSoft(cards: Card[]): boolean {
  let total = 0, aces = 0;
  for (const c of cards) { if (!c.faceUp) continue; total += cardValue(c.rank); if (c.rank === 'A') aces++; }
  return aces > 0 && total <= 21 && total - 10 + 10 === total;
}

type Phase = 'betting' | 'playing' | 'dealer' | 'result';
type Result = 'blackjack' | 'win' | 'push' | 'lose' | 'bust';

export default function BlackjackPage() {
  const { balance, addBalance, deductBalance } = useGame();

  const [deck, setDeck]         = useState<Card[]>(() => makeDeck());
  const [player, setPlayer]     = useState<Card[]>([]);
  const [dealer, setDealer]     = useState<Card[]>([]);
  const [phase, setPhase]       = useState<Phase>('betting');
  const [bet, setBet]           = useState(10);
  const [result, setResult]     = useState<Result | null>(null);
  const [winAmt, setWinAmt]     = useState(0);
  const [particles, setParticles] = useState(0);
  const [doubled, setDoubled]   = useState(false);
  const [msg, setMsg]           = useState('');

  const deckRef = useRef(deck);

  const drawCard = useCallback((faceUp = true): [Card, Card[]] => {
    const d = [...deckRef.current];
    if (d.length < 15) { deckRef.current = makeDeck(); return drawCard(faceUp); }
    const card = { ...d.pop()!, faceUp };
    deckRef.current = d;
    setDeck([...d]);
    return [card, d];
  }, []);

  const deal = useCallback(() => {
    if (phase !== 'betting') return;
    if (!deductBalance(bet)) return;

    deckRef.current = [...deck];

    const [c1] = drawCard(true);
    const [c2] = drawCard(false);
    const [c3] = drawCard(true);
    const [c4] = drawCard(true);

    const pHand = [c1, c3];
    const dHand = [c2, c4];

    setPlayer(pHand);
    setDealer(dHand);
    setResult(null);
    setWinAmt(0);
    setDoubled(false);
    setMsg('');

    // Check player blackjack
    const pTotal = handTotal(pHand);
    if (pTotal === 21) {
      // Reveal dealer card
      const fullDealer: Card[] = [{ ...c2, faceUp: true }, c4];
      const dTotal = handTotal(fullDealer);
      setDealer(fullDealer);
      if (dTotal === 21) {
        setResult('push'); addBalance(bet); setMsg('Push — Both have Blackjack');
      } else {
        const won = Math.round(bet * 2.5);
        addBalance(won); setResult('blackjack'); setWinAmt(won - bet);
        setParticles(p => p + 1); setMsg('♠ BLACKJACK! ♠');
      }
      setPhase('result');
    } else {
      setPhase('playing');
    }
  }, [phase, bet, deductBalance, addBalance, deck, drawCard]);

  const hit = useCallback(() => {
    if (phase !== 'playing') return;
    const [card] = drawCard();
    setPlayer(prev => {
      const next = [...prev, card];
      if (handTotal(next) > 21) {
        setResult('bust');
        setMsg('Bust! Over 21.');
        setPhase('result');
      }
      return next;
    });
  }, [phase, drawCard]);

  const standRef = useRef<((pHand?: Card[]) => void) | null>(null);

  const doubleDo = useCallback(() => {
    if (phase !== 'playing') return;
    if (!deductBalance(bet)) return;
    setDoubled(true);
    const [card] = drawCard();
    setPlayer(prev => {
      const next = [...prev, card];
      if (handTotal(next) > 21) {
        setResult('bust'); setMsg('Bust!'); setPhase('result');
        return next;
      }
      standRef.current?.([...prev, card]);
      return next;
    });
  }, [phase, deductBalance, bet, drawCard]);

  const stand = useCallback((pHand?: Card[]) => {
    if (phase !== 'playing' && !pHand) return;

    setPhase('dealer');

    // Reveal hole card
    setDealer(prev => {
      const revealed = prev.map(c => ({ ...c, faceUp: true }));

      const playerFinal = pHand ?? player;
      const playerTotal = handTotal(playerFinal);

      let dealerHand = [...revealed];

      // Dealer draws
      const drawLoop = () => {
        const dTotal = handTotal(dealerHand);
        // Dealer hits on hard 16 or below, and soft 17
        if (dTotal < 17 || (dTotal === 17 && isSoft(dealerHand))) {
          const [card] = drawCard();
          dealerHand = [...dealerHand, card];
          setDealer([...dealerHand]);
          setTimeout(drawLoop, 600);
        } else {
          // Resolve
          const dFinal = handTotal(dealerHand);
          setTimeout(() => {
            let res: Result;
            if (dFinal > 21 || playerTotal > dFinal)      { res = 'win'; }
            else if (playerTotal === dFinal)               { res = 'push'; }
            else                                           { res = 'lose'; }

            const totalBet = doubled ? bet * 2 : bet;
            if (res === 'win')  { const won = totalBet * 2; addBalance(won); setWinAmt(totalBet); setParticles(p => p + 1); setMsg('You Win! 🎉'); }
            if (res === 'push') { addBalance(totalBet); setMsg('Push — Tie!'); }
            if (res === 'lose') { setMsg('Dealer Wins.'); }

            setResult(res);
            setPhase('result');
          }, 400);
        }
      };

      setTimeout(drawLoop, 500);
      return revealed;
    });
  }, [phase, player, doubled, bet, addBalance, drawCard]);

  // Keep standRef in sync so doubleDo can call it without a stale closure
  standRef.current = stand;

  const newRound = () => {
    setPhase('betting');
    setPlayer([]);
    setDealer([]);
    setResult(null);
    setWinAmt(0);
    setMsg('');
  };

  const pTotal = handTotal(player);
  const dTotal = handTotal(dealer.filter(c => c.faceUp));
  const BET_CHIPS = [5, 10, 25, 50, 100, 200];

  return (
    <>
      <CosmicBackground />
      <Header />
      <ParticleSystem trigger={particles} x={0.5} y={0.4} intensity={winAmt >= 100 ? 'big' : 'medium'} />

      <div className="game-page">
        <h1 className="game-title" style={{ color: 'var(--cyan-light)' }}>
          Blackjack
        </h1>
        <div className="game-subtitle">Beat the dealer · 21 wins</div>

        <div className="bj-table" style={{ width: '100%', maxWidth: 720, padding: '0 16px' }}>

          {/* Dealer zone */}
          <div className="glass bj-zone" style={{ marginBottom: '12px', background: 'rgba(6,3,18,0.6)' }}>
            <span className="bj-zone-label">Dealer</span>
            {dealer.length > 0 && (
              <span
                className={`bj-score ${dTotal > 21 ? 'bust' : ''}`}
              >
                {dTotal > 0 ? dTotal : '?'}
                {dTotal > 21 ? ' BUST' : ''}
              </span>
            )}
            {dealer.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Waiting…</span>
            ) : (
              dealer.map((card, i) => (
                <PlayingCard key={card.id} card={card} dealDelay={i * 150} />
              ))
            )}
          </div>

          {/* Divider with felt texture */}
          <div
            style={{
              height: '48px',
              background: 'linear-gradient(135deg, rgba(6,182,212,0.04), rgba(139,92,246,0.04))',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            {phase === 'betting' && (
              <span style={{ fontSize: '0.7rem', letterSpacing: '0.3em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Place Your Bet
              </span>
            )}
            {(phase === 'playing' || phase === 'dealer') && (
              <span style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--cyan)', textTransform: 'uppercase' }}>
                Bet: ${doubled ? bet * 2 : bet}
              </span>
            )}
            {phase === 'result' && msg && (
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: result === 'win' || result === 'blackjack' ? 'var(--green-light)'
                       : result === 'lose' || result === 'bust'    ? 'var(--red-light)'
                       : 'var(--gold-light)',
                  animation: 'scale-in 0.4s var(--ease-spring)',
                }}
              >
                {msg}
                {winAmt > 0 && <span style={{ color: 'var(--gold-light)', marginLeft: 10 }}>+${winAmt}</span>}
              </span>
            )}
          </div>

          {/* Player zone */}
          <div className="glass bj-zone" style={{ background: 'rgba(6,3,18,0.6)' }}>
            <span className="bj-zone-label">You</span>
            {player.length > 0 && (
              <span
                className={`bj-score ${pTotal > 21 ? 'bust' : pTotal === 21 ? 'bj' : ''}`}
              >
                {pTotal}
                {pTotal > 21 ? ' BUST' : pTotal === 21 ? ' ♠' : ''}
              </span>
            )}
            {player.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Waiting…</span>
            ) : (
              player.map((card, i) => (
                <PlayingCard key={card.id} card={card} dealDelay={i * 150 + 100} />
              ))
            )}
          </div>

          {/* Actions */}
          <div className="bj-actions">
            {phase === 'betting' && (
              <>
                <div style={{ width: '100%', textAlign: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Select Bet
                  </div>
                  <div className="bet-controls">
                    {BET_CHIPS.map(b => (
                      <button
                        key={b}
                        className={`bet-chip ${b <= 5 ? 'chip-5' : b <= 10 ? 'chip-10' : b <= 25 ? 'chip-25' : b <= 100 ? 'chip-100' : 'chip-500'}`}
                        style={{
                          outline: bet === b ? '2px solid var(--gold)' : 'none',
                          outlineOffset: 3,
                        }}
                        onClick={() => setBet(b)}
                      >
                        ${b}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className="btn btn-cyan glow-cyan"
                  style={{ minWidth: 180, padding: '14px 40px', marginTop: '8px' }}
                  onClick={deal}
                  disabled={balance < bet}
                >
                  🃏 Deal (${bet})
                </button>
              </>
            )}

            {phase === 'playing' && (
              <>
                <button className="btn btn-green" onClick={hit}>Hit</button>
                <button className="btn btn-ghost" onClick={() => stand()}>Stand</button>
                {player.length === 2 && balance >= bet && !doubled && (
                  <button className="btn btn-gold" onClick={doubleDo}>Double</button>
                )}
              </>
            )}

            {phase === 'result' && (
              <button className="btn btn-purple glow-purple" onClick={newRound} style={{ minWidth: 180 }}>
                New Round
              </button>
            )}
          </div>

          {/* Balance */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '20px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.1em',
            }}
          >
            Balance: <span style={{ color: 'var(--gold-light)' }}>${balance}</span>
          </div>
        </div>
      </div>
    </>
  );
}
