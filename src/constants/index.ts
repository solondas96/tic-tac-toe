import type { Settings, GameStats, GameState } from '../types';

export const LOCAL_STORAGE_KEYS = {
  THEME: 'ttt_theme_mode',
  SETTINGS: 'ttt_settings',
  STATS: 'ttt_stats',
  LATEST_MODE: 'ttt_latest_mode',
} as const;

export const WINNING_COMBINATIONS = [
  [0, 1, 2], // Row 1
  [3, 4, 5], // Row 2
  [6, 7, 8], // Row 3
  [0, 3, 6], // Col 1
  [1, 4, 7], // Col 2
  [2, 5, 8], // Col 3
  [0, 4, 8], // Diagonal 1
  [2, 4, 6], // Diagonal 2
];

export const DEFAULT_SETTINGS: Settings = {
  difficulty: 'hard',
  soundEnabled: true,
  animationsEnabled: true,
  firstPlayer: 'X',
  aiDelay: 500, // ms
  timerDuration: 15, // seconds for make a move timer
};

export const INITIAL_STATS: GameStats = {
  xWins: 0,
  oWins: 0,
  aiWins: 0,
  draws: 0,
  currentStreak: 0,
  longestStreak: 0,
  bestTime: null,
  totalGames: 0,
  winPercentage: 0,
  gameHistory: [],
};

export const INITIAL_GAME_STATE: GameState = {
  board: Array(9).fill(null),
  isXNext: true,
  winner: null,
  winningLine: null,
  history: [],
  status: 'idle',
  mode: 'ai',
  timer: 15,
  hasAIMoved: false,
};

export const SOUND_EFFECTS = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', // soft select
  place: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-84.wav', // high tick
  win: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav', // subtle level win
  draw: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-84.wav', // draw sound
  reset: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-84.wav', // swap/whoosh
} as const;
