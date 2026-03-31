export interface Card {
  suit: '♠' | '♣' | '♥' | '♦';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  faceUp: boolean;
  id: string;
}

export type GamePhase =
  | 'idle'
  | 'betting'
  | 'playing'
  | 'dealer'
  | 'result'
  | 'spinning'
  | 'running'
  | 'crashed';
