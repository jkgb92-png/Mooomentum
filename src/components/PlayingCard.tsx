import { Card } from '../types';

interface PlayingCardProps {
  card: Card;
  style?: React.CSSProperties;
  size?: 'normal' | 'large';
  dealDelay?: number;
}

const SUIT_COLOR: Record<string, string> = {
  '♥': 'suit-red',
  '♦': 'suit-red',
  '♠': 'suit-black',
  '♣': 'suit-black',
};

export default function PlayingCard({ card, style, size = 'normal', dealDelay = 0 }: PlayingCardProps) {
  const colorClass = SUIT_COLOR[card.suit];
  const sizeClass  = size === 'large' ? 'card-lg' : '';

  return (
    <div
      className="card-container"
      style={style}
    >
      <div
        className={`card ${sizeClass} ${!card.faceUp ? 'face-down' : ''} dealing`}
        style={{ animationDelay: `${dealDelay}ms` }}
      >
        {/* Face */}
        <div className="card-face">
          <div>
            <div className={`card-rank-top ${colorClass}`}>{card.rank}</div>
            <div className={`card-suit-top ${colorClass}`}>{card.suit}</div>
          </div>
          <div className={`card-center ${colorClass}`}>{card.suit}</div>
          <div className={`card-rank-bottom ${colorClass}`}>{card.rank}</div>
        </div>

        {/* Back */}
        <div className="card-back">✦</div>
      </div>
    </div>
  );
}
