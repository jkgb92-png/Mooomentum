export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
  totalWinnings: number;
  gamesPlayed: number;
  avatar: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'win' | 'loss' | 'deposit' | 'bonus';
  amount: number;
  game: string;
  timestamp: string;
}

export interface GameState {
  currentGame: string | null;
  isPlaying: boolean;
}
