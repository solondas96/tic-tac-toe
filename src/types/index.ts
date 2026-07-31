export type Player = 'X' | 'O' | null;

export type GameMode = 'pvp' | 'ai';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type BoardState = Player[]; // 9 elements

export interface Move {
  index: number;
  player: Player;
  timeRemaining?: number; // for timer
}

export interface GameStats {
  xWins: number;
  oWins: number;
  aiWins: number;
  draws: number;
  currentStreak: number;
  longestStreak: number;
  bestTime: number | null; // in seconds, for AI mode win
  totalGames: number;
  winPercentage: number;
  gameHistory: GameHistoryItem[];
}

export interface GameHistoryItem {
  id: string;
  date: string;
  mode: GameMode;
  difficulty?: Difficulty;
  winner: 'X' | 'O' | 'Draw';
  movesCount: number;
  duration: number; // in seconds
}

export interface Settings {
  difficulty: Difficulty;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  firstPlayer: 'X' | 'O' | 'random' | 'winner';
  aiDelay: number; // in ms
  timerDuration: number; // in seconds (for bonus move timer, e.g. 10s, 15s)
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface GameState {
  board: BoardState;
  isXNext: boolean;
  winner: Player | 'Draw';
  winningLine: number[] | null;
  history: Move[];
  status: 'idle' | 'playing' | 'paused' | 'ended';
  mode: GameMode;
  timer: number;
  hasAIMoved: boolean;
}
