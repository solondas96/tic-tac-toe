import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import './App.css';

type Player = 'X' | 'O';
type GameMode = 'ai' | 'pvp';
type Difficulty = 'easy' | 'medium' | 'hard';
type ThemeMode = 'light' | 'dark' | 'system';
type OpeningMode = 'human' | 'computer' | 'random' | 'alternate';
type TournamentLength = 0 | 3 | 5;
type GameWinner = Player | 'Draw' | null;

type BoardState = Array<Player | null>;

interface Move {
  index: number;
  player: Player;
  turn: number;
  timestamp: number;
}

interface Stats {
  xWins: number;
  oWins: number;
  draws: number;
  totalGames: number;
  currentStreak: number;
  longestStreak: number;
  bestWinTurns: number | null;
  lastWinner: GameWinner;
}

interface Settings {
  mode: GameMode;
  difficulty: Difficulty;
  theme: ThemeMode;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  opening: OpeningMode;
  tournamentLength: TournamentLength;
  humanName: string;
  computerName: string;
  xName: string;
  oName: string;
  aiDelay: number;
}

interface GameSummary {
  winner: GameWinner;
  winningLine: number[] | null;
  moves: Move[];
  durationMs: number;
  turns: number;
}

interface BoardOutcome {
  winner: GameWinner;
  winningLine: number[] | null;
  isDraw: boolean;
}

const STORAGE_KEYS = {
  settings: 'ttt_settings_v2',
  stats: 'ttt_stats_v2',
  history: 'ttt_history_v2',
};

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const CELL_LABELS = [
  'top left',
  'top center',
  'top right',
  'middle left',
  'center',
  'middle right',
  'bottom left',
  'bottom center',
  'bottom right',
];

const DEFAULT_SETTINGS: Settings = {
  mode: 'ai',
  difficulty: 'hard',
  theme: 'system',
  soundEnabled: true,
  animationsEnabled: true,
  opening: 'human',
  tournamentLength: 0,
  humanName: 'Player',
  computerName: 'Computer',
  xName: 'Player 1',
  oName: 'Player 2',
  aiDelay: 520,
};

const DEFAULT_STATS: Stats = {
  xWins: 0,
  oWins: 0,
  draws: 0,
  totalGames: 0,
  currentStreak: 0,
  longestStreak: 0,
  bestWinTurns: null,
  lastWinner: null,
};

const createEmptyBoard = (): BoardState => Array(9).fill(null);

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const getBoardOutcome = (board: BoardState): BoardOutcome => {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, winningLine: line, isDraw: false };
    }
  }

  const isDraw = board.every((cell) => cell !== null);
  return { winner: isDraw ? 'Draw' : null, winningLine: null, isDraw };
};

const getAvailableMoves = (board: BoardState) =>
  board.flatMap((cell, index) => (cell === null ? [index] : []));

const minimax = (
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  aiPlayer: Player,
  humanPlayer: Player,
) => {
  const outcome = getBoardOutcome(board);

  if (outcome.winner === aiPlayer) return 10 - depth;
  if (outcome.winner === humanPlayer) return depth - 10;
  if (outcome.isDraw) return 0;

  const moves = getAvailableMoves(board);

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const index of moves) {
      board[index] = aiPlayer;
      bestScore = Math.max(bestScore, minimax(board, depth + 1, false, aiPlayer, humanPlayer));
      board[index] = null;
    }
    return bestScore;
  }

  let bestScore = Infinity;
  for (const index of moves) {
    board[index] = humanPlayer;
    bestScore = Math.min(bestScore, minimax(board, depth + 1, true, aiPlayer, humanPlayer));
    board[index] = null;
  }
  return bestScore;
};

const pickComputerMove = (board: BoardState, difficulty: Difficulty) => {
  const moves = getAvailableMoves(board);
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  if (difficulty === 'medium' && Math.random() < 0.45) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const aiPlayer: Player = 'O';
  const humanPlayer: Player = 'X';
  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const index of moves) {
    board[index] = aiPlayer;
    const score = minimax(board, 0, false, aiPlayer, humanPlayer);
    board[index] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }

  return bestMove;
};

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const cloneBoard = (board: BoardState) => board.slice();

function App() {
  const [settings, setSettings] = useState<Settings>(() => readJSON(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
  const [stats, setStats] = useState<Stats>(() => readJSON(STORAGE_KEYS.stats, DEFAULT_STATS));
  const [gameHistory, setGameHistory] = useState<GameSummary[]>(() => readJSON(STORAGE_KEYS.history, []));
  const [board, setBoard] = useState<BoardState>(() => createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<GameWinner>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [lastRoundMoves, setLastRoundMoves] = useState<Move[]>([]);
  const [seriesScore, setSeriesScore] = useState({ X: 0, O: 0 });
  const [statusMessage, setStatusMessage] = useState('Choose a mode to begin.');
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayBoard, setReplayBoard] = useState<BoardState | null>(null);
  const [replayIndex, setReplayIndex] = useState(0);
  const [announcement, setAnnouncement] = useState('Ready to play');
  const [themePreview, setThemePreview] = useState<'light' | 'dark'>('dark');
  const [restartToken, setRestartToken] = useState(0);

  const startingPlayerRef = useRef<Player>('X');
  const lastStartRef = useRef<Player>('X');
  const audioRef = useRef<AudioContext | null>(null);
  const celebrationRef = useRef<string>('');
  const roundStartRef = useRef<number>(Date.now());

  const resolvedTheme = useMemo(() => {
    if (settings.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return settings.theme;
  }, [settings.theme]);

  const activeBoard = replayBoard ?? board;
  const modeLabel = settings.mode === 'ai' ? 'Player vs Computer' : 'Player vs Player';
  const xLabel = settings.mode === 'ai' ? settings.humanName : settings.xName;
  const oLabel = settings.mode === 'ai' ? settings.computerName : settings.oName;
  const boardOutcome = getBoardOutcome(activeBoard);
  const activeWinner = winner ?? boardOutcome.winner;
  const completedTurns = moveHistory.length;
  const totalWins = stats.xWins + stats.oWins;
  const winRate = stats.totalGames ? Math.round((totalWins / stats.totalGames) * 100) : 0;
  const neededSeriesWins = settings.tournamentLength ? Math.floor(settings.tournamentLength / 2) + 1 : 0;
  const seriesComplete =
    settings.tournamentLength > 0 &&
    (seriesScore.X >= neededSeriesWins || seriesScore.O >= neededSeriesWins);
  const seriesWinner = seriesComplete ? (seriesScore.X > seriesScore.O ? 'X' : 'O') : null;
  const scoreboard = useMemo(
    () =>
      settings.mode === 'ai'
        ? [
            { label: 'Wins', value: stats.xWins, tone: 'good' as const },
            { label: 'Losses', value: stats.oWins, tone: 'danger' as const },
            { label: 'Draws', value: stats.draws, tone: 'warn' as const },
          ]
        : [
            { label: `${xLabel} wins`, value: stats.xWins, tone: 'good' as const },
            { label: `${oLabel} wins`, value: stats.oWins, tone: 'danger' as const },
            { label: 'Draws', value: stats.draws, tone: 'warn' as const },
          ],
    [oLabel, settings.mode, stats.draws, stats.oWins, stats.xWins, xLabel],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(gameHistory.slice(0, 12)));
  }, [gameHistory]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    setThemePreview(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (settings.theme === 'system') {
        document.documentElement.dataset.theme = media.matches ? 'dark' : 'light';
        setThemePreview(media.matches ? 'dark' : 'light');
      }
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [settings.theme]);

  useEffect(() => {
    if (!boardOutcome.winner || winner) return;
    if (celebrationRef.current === `${boardOutcome.winner}-${moveHistory.length}`) return;

    celebrationRef.current = `${boardOutcome.winner}-${moveHistory.length}`;

    if (settings.animationsEnabled) {
      confetti({
        particleCount: 120,
        spread: 72,
        origin: { y: 0.72 },
        colors: ['#a855f7', '#f97316', '#22c55e', '#38bdf8', '#facc15'],
      });
    }
  }, [boardOutcome.winner, moveHistory.length, settings.animationsEnabled, winner]);

  useEffect(() => {
    if (settings.mode !== 'ai') return;
    if (winner || isResultOpen || isReplaying) return;
    if (currentPlayer !== 'O') return;

    const timer = window.setTimeout(() => {
      const move = pickComputerMove(cloneBoard(board), settings.difficulty);
      if (move === null) return;
      placeMove(move, 'O');
    }, settings.aiDelay);

    return () => window.clearTimeout(timer);
  }, [board, currentPlayer, isReplaying, isResultOpen, settings.aiDelay, settings.difficulty, settings.mode, winner]);

  useEffect(() => {
    if (!isReplaying) return;
    if (replayIndex >= lastRoundMoves.length) {
      setIsReplaying(false);
      setReplayBoard(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setReplayBoard((current) => {
        const nextBoard = cloneBoard(current ?? createEmptyBoard());
        const move = lastRoundMoves[replayIndex];
        nextBoard[move.index] = move.player;
        return nextBoard;
      });
      setReplayIndex((index) => index + 1);
    }, settings.animationsEnabled ? 450 : 10);

    return () => window.clearTimeout(timer);
  }, [isReplaying, lastRoundMoves, replayIndex, settings.animationsEnabled]);

  const playTone = (kind: 'click' | 'move' | 'win' | 'draw' | 'reset') => {
    if (!settings.soundEnabled) return;

    const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = audioRef.current ?? new AudioContextClass();
    audioRef.current = context;

    const tones: Record<'click' | 'move' | 'win' | 'draw' | 'reset', number[]> = {
      click: [440, 660],
      move: [560],
      win: [660, 830, 990],
      draw: [330, 277],
      reset: [392, 523],
    };

    let start = context.currentTime;
    tones[kind].forEach((frequency) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.03;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.11);
      start += 0.09;
    });
  };

  const vibrate = (pattern: number | number[]) => {
    if (!navigator.vibrate) return;
    navigator.vibrate(pattern);
  };

  const announceState = (message: string) => {
    setStatusMessage(message);
    setAnnouncement(message);
  };

  const persistResult = (summary: GameSummary) => {
    setGameHistory((current) => [summary, ...current].slice(0, 12));
  };

  const updateStatsForWinner = (result: GameWinner, turns: number) => {
    setStats((current) => {
      const next = { ...current };
      next.totalGames += 1;

      if (result === 'Draw') {
        next.draws += 1;
        next.currentStreak = 0;
        next.lastWinner = 'Draw';
        return next;
      }

      if (result === 'X') next.xWins += 1;
      if (result === 'O') next.oWins += 1;

      if (current.lastWinner === result) {
        next.currentStreak += 1;
      } else {
        next.currentStreak = 1;
      }

      next.longestStreak = Math.max(next.longestStreak, next.currentStreak);
      next.lastWinner = result;
      next.bestWinTurns = next.bestWinTurns === null ? turns : Math.min(next.bestWinTurns, turns);
      return next;
    });
  };

  const getStartingPlayer = () => {
    if (settings.opening === 'human') return 'X';
    if (settings.opening === 'computer') return 'O';
    if (settings.opening === 'random') return Math.random() < 0.5 ? 'X' : 'O';

    const next = lastStartRef.current === 'X' ? 'O' : 'X';
    lastStartRef.current = next;
    return next;
  };

  const startRound = () => {
    const starter = getStartingPlayer();
    startingPlayerRef.current = starter;
    roundStartRef.current = Date.now();
    setBoard(createEmptyBoard());
    setReplayBoard(null);
    setReplayIndex(0);
    setMoveHistory([]);
    setLastRoundMoves([]);
    setWinner(null);
    setWinningLine(null);
    setIsResultOpen(false);
    setIsReplaying(false);
    setCurrentPlayer(starter);

    if (starter === 'O') {
      announceState(
        settings.mode === 'ai'
          ? `${settings.computerName} opens the round.`
          : `${oLabel} starts.`,
      );
    } else {
      announceState(
        settings.mode === 'ai'
          ? `${settings.humanName}, make the opening move.`
          : `${xLabel} starts.`,
      );
    }

    playTone('reset');
  };

  const resetEverything = () => {
    setStats(DEFAULT_STATS);
    setGameHistory([]);
    setSeriesScore({ X: 0, O: 0 });
  };

  const finishRound = (result: GameWinner, line: number[] | null) => {
    const finishedAt = Date.now();
    const durationMs = finishedAt - roundStartRef.current;
    const turns = moveHistory.length;
    const winnerPlayer: Player | null = result === 'X' || result === 'O' ? result : null;
    const nextSeriesScore: { X: number; O: number } =
      settings.tournamentLength > 0 && winnerPlayer
        ? winnerPlayer === 'X'
          ? { X: seriesScore.X + 1, O: seriesScore.O }
          : { X: seriesScore.X, O: seriesScore.O + 1 }
        : seriesScore;
    const nextSeriesComplete =
      settings.tournamentLength > 0 &&
      (nextSeriesScore.X >= neededSeriesWins || nextSeriesScore.O >= neededSeriesWins);
    const nextSeriesWinner: Player | null = nextSeriesComplete
      ? nextSeriesScore.X > nextSeriesScore.O
        ? 'X'
        : 'O'
      : null;

    setWinner(result);
    setWinningLine(line);
    setIsResultOpen(true);
    setLastRoundMoves(moveHistory);

    const summary: GameSummary = {
      winner: result,
      winningLine: line,
      moves: moveHistory,
      durationMs,
      turns,
    };

    persistResult(summary);
    updateStatsForWinner(result, turns);

    if (settings.tournamentLength > 0 && result !== 'Draw') {
      setSeriesScore(nextSeriesScore);
    }

    const resultText =
      result === 'Draw'
        ? 'It is a draw.'
        : settings.mode === 'ai'
          ? result === 'X'
            ? `${settings.humanName} wins the round.`
            : `${settings.computerName} wins the round.`
          : `${result === 'X' ? xLabel : oLabel} wins the round.`;

    const nextMessage = settings.tournamentLength > 0
      ? nextSeriesComplete
        ? `Series complete. ${nextSeriesWinner === 'X' ? xLabel : oLabel} wins the match.`
        : `${resultText} Series score ${nextSeriesScore.X} - ${nextSeriesScore.O}.`
      : resultText;

    announceState(nextMessage);

    if (result === 'Draw') playTone('draw');
    else playTone('win');

    vibrate(result === 'Draw' ? [40, 30, 40] : [70, 40, 70]);
  };

  const placeMove = (index: number, player: Player) => {
    if (winner || isResultOpen || isReplaying) return false;
    if (board[index] !== null) return false;

    const nextBoard = cloneBoard(board);
    nextBoard[index] = player;
    const nextMove = { index, player, turn: moveHistory.length + 1, timestamp: Date.now() };

    setBoard(nextBoard);
    setMoveHistory((current) => [...current, nextMove]);
    playTone('move');
    if (settings.animationsEnabled) vibrate(12);

    const outcome = getBoardOutcome(nextBoard);
    if (outcome.winner) {
      finishRound(outcome.winner, outcome.winningLine);
      return true;
    }

    const nextPlayer = player === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextPlayer);
    announceState(
      settings.mode === 'ai'
        ? nextPlayer === 'X'
          ? `${settings.humanName}, your turn.`
          : `${settings.computerName} is thinking...`
        : `${nextPlayer === 'X' ? xLabel : oLabel} to move.`,
    );
    return true;
  };

  const handleCellClick = (index: number) => {
    if (settings.mode === 'ai' && currentPlayer !== 'X') return;
    if (winner || isResultOpen || isReplaying) return;
    if (board[index] !== null) return;
    placeMove(index, currentPlayer);
    playTone('click');
  };

  const handleUndo = () => {
    if (isReplaying || isResultOpen) return;
    if (moveHistory.length === 0) return;

    if (settings.mode === 'ai') {
      const trimmed = moveHistory.slice(0, Math.max(0, moveHistory.length - 2));
      const nextBoard = createEmptyBoard();
      trimmed.forEach((move) => {
        nextBoard[move.index] = move.player;
      });
      setMoveHistory(trimmed);
      setBoard(nextBoard);
      setCurrentPlayer('X');
      setWinner(null);
      setWinningLine(null);
      announceState(`${settings.humanName}, you can try a different line.`);
      playTone('click');
      return;
    }

    const trimmed = moveHistory.slice(0, -1);
    const nextBoard = createEmptyBoard();
    trimmed.forEach((move) => {
      nextBoard[move.index] = move.player;
    });
    const removedMove = moveHistory[moveHistory.length - 1];
    setMoveHistory(trimmed);
    setBoard(nextBoard);
    setCurrentPlayer(removedMove.player);
    setWinner(null);
    setWinningLine(null);
    announceState(`${removedMove.player}'s move was undone.`);
    playTone('click');
  };

  const handleReplay = () => {
    if (lastRoundMoves.length === 0) return;
    setReplayBoard(createEmptyBoard());
    setReplayIndex(0);
    setIsReplaying(true);
    setIsResultOpen(false);
    setAnnouncement('Replaying the last match.');
  };

  const toggleTheme = () => {
    setSettings((current) => ({
      ...current,
      theme: resolvedTheme === 'dark' ? 'light' : 'dark',
    }));
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleModeChange = (mode: GameMode) => {
    updateSetting('mode', mode);
    setRestartToken((value) => value + 1);
  };

  const handleResetRound = () => {
    setRestartToken((value) => value + 1);
  };

  const handleModePreset = (opening: OpeningMode) => {
    updateSetting('opening', opening);
    setRestartToken((value) => value + 1);
  };

  const handleNewGame = () => {
    resetEverything();
    setRestartToken((value) => value + 1);
  };

  useEffect(() => {
    startRound();
    // restartToken is the explicit trigger for new rounds and mode resets.
  }, [restartToken]);

  const currentScoreTiles = useMemo(() => {
    const humanWins = stats.xWins;
    const opponentWins = stats.oWins;

    return [
      { label: 'Games', value: stats.totalGames.toString() },
      { label: 'Win rate', value: `${winRate}%` },
      { label: 'Best win', value: stats.bestWinTurns ? `${stats.bestWinTurns} turns` : '—' },
      { label: 'Streak', value: stats.currentStreak.toString() },
      { label: settings.mode === 'ai' ? 'Your wins' : xLabel, value: humanWins.toString() },
      { label: settings.mode === 'ai' ? 'Computer wins' : oLabel, value: opponentWins.toString() },
    ];
  }, [oLabel, settings.mode, stats.bestWinTurns, stats.currentStreak, stats.oWins, stats.totalGames, stats.xWins, winRate, xLabel]);

  const selectedResult = useMemo(() => {
    if (!activeWinner) return null;

    if (activeWinner === 'Draw') {
      return {
        title: 'Draw',
        subtitle: 'No one could force a win this round.',
        tone: 'warn' as const,
      };
    }

    const name = activeWinner === 'X' ? xLabel : oLabel;
    return {
      title: `${name} wins`,
      subtitle: settings.mode === 'ai' && activeWinner === 'X' ? 'You played the stronger game.' : 'Clean tactical finish.',
      tone: 'good' as const,
    };
  }, [activeWinner, oLabel, settings.mode, xLabel]);

  const winningCells = winningLine ?? boardOutcome.winningLine;
  const historyDisplay = lastRoundMoves.length > 0 ? lastRoundMoves : moveHistory;

  return (
    <div className={`app-shell theme-${themePreview}`}>
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <header className="topbar panel">
        <div>
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="img">
              <rect x="4" y="4" width="56" height="56" rx="14" className="logo-frame" />
              <path d="M24 16v32M40 16v32M16 24h32M16 40h32" className="logo-grid" />
              <path d="M19 19l8 8m0-8l-8 8" className="logo-x" />
              <circle cx="46" cy="46" r="4.8" className="logo-o" />
            </svg>
          </div>
          <h1>XOXO</h1>
          <p className="subtitle">Mode: {modeLabel} · Difficulty: {settings.difficulty} · Tournament: {settings.tournamentLength ? `best of ${settings.tournamentLength}` : 'off'}</p>
        </div>

        <div className="header-actions">
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Toggle theme">
            {resolvedTheme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="ghost-button" type="button" onClick={handleNewGame}>
            Reset all
          </button>
        </div>
      </header>

      <main className="layout-grid">
        <section className="stack">
          <article className="panel hero-card">
            <div className="hero-head">
              <div>
                <p className="eyebrow">Game mode</p>
                <h2>Choose how you want to play</h2>
              </div>
              <div className="status-pill">{settings.mode === 'ai' ? 'Computer enabled' : 'Local duel'}</div>
            </div>

            <div className="segmented-control" role="group" aria-label="Game mode selector">
              <button
                type="button"
                className={settings.mode === 'pvp' ? 'segmented active' : 'segmented'}
                onClick={() => handleModeChange('pvp')}
              >
                Player vs Player
              </button>
              <button
                type="button"
                className={settings.mode === 'ai' ? 'segmented active' : 'segmented'}
                onClick={() => handleModeChange('ai')}
              >
                Player vs Computer
              </button>
            </div>

            <div className="hero-stats">
              {scoreboard.map((tile) => (
                <div key={tile.label} className={`stat-tile ${tile.tone}`}>
                  <span>{tile.label}</span>
                  <strong>{tile.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel players-card">
            <div className="players-header">
              <div>
                <p className="eyebrow">Players</p>
                <h2>Identity, turn, and strategy</h2>
              </div>
              <div className="status-pill">Move {completedTurns} / 9</div>
            </div>

            <div className="players-grid">
              <label className={currentPlayer === 'X' ? 'player-chip active' : 'player-chip'}>
                <span className="chip-badge x">X</span>
                <div>
                  <small>{settings.mode === 'ai' ? 'Human' : 'Player X'}</small>
                  <input
                    value={settings.mode === 'ai' ? settings.humanName : settings.xName}
                    onChange={(event) =>
                      updateSetting(settings.mode === 'ai' ? 'humanName' : 'xName', event.target.value)
                    }
                    aria-label="Player X name"
                  />
                </div>
              </label>

              <div className="versus-mark">vs</div>

              <label className={currentPlayer === 'O' ? 'player-chip active' : 'player-chip'}>
                <span className="chip-badge o">O</span>
                <div>
                  <small>{settings.mode === 'ai' ? 'Computer' : 'Player O'}</small>
                  <input
                    value={settings.mode === 'ai' ? settings.computerName : settings.oName}
                    onChange={(event) =>
                      updateSetting(settings.mode === 'ai' ? 'computerName' : 'oName', event.target.value)
                    }
                    aria-label="Player O name"
                  />
                </div>
              </label>
            </div>
          </article>

          <article className="panel board-card">
            <div className="board-topbar">
              <div>
                <p className="eyebrow">Live board</p>
                <h2>{statusMessage}</h2>
              </div>
              <div className="board-meta">
                <span className="meta-pill">Turn: {currentPlayer}</span>
                <span className="meta-pill">History: {historyDisplay.length}</span>
              </div>
            </div>

            <div className="board-frame">
              <div className="board" role="grid" aria-label="Tic tac toe board">
                {activeBoard.map((cell, index) => (
                  <button
                    key={index}
                    type="button"
                    className={[
                      'cell',
                      cell === 'X' ? 'x' : '',
                      cell === 'O' ? 'o' : '',
                      winningCells?.includes(index) ? 'winning' : '',
                      settings.animationsEnabled ? 'animated' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleCellClick(index)}
                    aria-label={`Cell ${index + 1}, ${CELL_LABELS[index]}, ${cell ?? 'empty'}`}
                    disabled={Boolean(cell) || !!activeWinner || isReplaying || (settings.mode === 'ai' && currentPlayer !== 'X')}
                  >
                    {cell}
                  </button>
                ))}
              </div>
            </div>

            <div className="actions-row">
              <button type="button" className="secondary-button" onClick={handleUndo} disabled={moveHistory.length === 0 || isReplaying}>
                Undo
              </button>
              <button type="button" className="secondary-button" onClick={handleResetRound}>
                Reset round
              </button>
              <button type="button" className="secondary-button" onClick={handleReplay} disabled={lastRoundMoves.length === 0}>
                Replay last
              </button>
              <button type="button" className="primary-button" onClick={handleNewGame}>
                New game
              </button>
            </div>

            <div className="live-announce" aria-live="polite" aria-atomic="true">
              {announcement}
            </div>
          </article>

          <article className="panel results-card">
            <div className="card-head">
              <div>
                <p className="eyebrow">Match control</p>
                <h2>Round, series, and reset behaviour</h2>
              </div>
              <div className="status-pill">{seriesComplete ? `${seriesWinner === 'X' ? xLabel : oLabel} won the match` : 'Series active'}</div>
            </div>

            <div className="settings-grid compact">
              <div className="setting-group">
                <span>Starting player</span>
                <div className="chip-row">
                  {(['human', 'computer', 'random', 'alternate'] as OpeningMode[]).map((opening) => (
                    <button
                      key={opening}
                      type="button"
                      className={settings.opening === opening ? 'chip active' : 'chip'}
                      onClick={() => handleModePreset(opening)}
                    >
                      {opening}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-group">
                <span>Tournament</span>
                <div className="chip-row">
                  {([0, 3, 5] as TournamentLength[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={settings.tournamentLength === value ? 'chip active' : 'chip'}
                      onClick={() => updateSetting('tournamentLength', value)}
                    >
                      {value === 0 ? 'Off' : `Best of ${value}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </section>

        <aside className="stack sidebar">
          <article className="panel stats-card">
            <div className="card-head">
              <div>
                <p className="eyebrow">Stats</p>
                <h2>Scoreboard and streaks</h2>
              </div>
              <button type="button" className="ghost-button small" onClick={resetEverything}>
                Reset stats
              </button>
            </div>

            <div className="stats-grid">
              {currentScoreTiles.map((tile) => (
                <div key={tile.label} className="stat-box">
                  <span>{tile.label}</span>
                  <strong>{tile.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel settings-card">
            <div className="card-head">
              <div>
                <p className="eyebrow">Settings</p>
                <h2>Difficulty, theme, sound, and motion</h2>
              </div>
            </div>

            <div className="settings-grid">
              <label className="setting-group">
                <span>Difficulty</span>
                <select value={settings.difficulty} onChange={(event) => updateSetting('difficulty', event.target.value as Difficulty)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>

              <label className="setting-group">
                <span>Theme</span>
                <select value={settings.theme} onChange={(event) => updateSetting('theme', event.target.value as ThemeMode)}>
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>

              <label className="setting-group">
                <span>Sound</span>
                <button
                  type="button"
                  className={settings.soundEnabled ? 'toggle on' : 'toggle'}
                  onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                >
                  {settings.soundEnabled ? 'On' : 'Off'}
                </button>
              </label>

              <label className="setting-group">
                <span>Animations</span>
                <button
                  type="button"
                  className={settings.animationsEnabled ? 'toggle on' : 'toggle'}
                  onClick={() => updateSetting('animationsEnabled', !settings.animationsEnabled)}
                >
                  {settings.animationsEnabled ? 'On' : 'Off'}
                </button>
              </label>
            </div>
          </article>

          <article className="panel history-card">
            <div className="card-head">
              <div>
                <p className="eyebrow">Move history</p>
                <h2>Step-by-step round log</h2>
              </div>
              <span className="status-pill">{lastRoundMoves.length ? 'Replay ready' : 'Waiting'}</span>
            </div>

            <div className="history-list">
              {historyDisplay.length === 0 ? (
                <p className="empty-state">Every turn will appear here once the round starts.</p>
              ) : (
                historyDisplay.map((move) => (
                  <div key={`${move.turn}-${move.index}-${move.timestamp}`} className="history-item">
                    <strong>#{move.turn}</strong>
                    <span>{move.player}</span>
                    <small>{CELL_LABELS[move.index]}</small>
                  </div>
                ))
              )}
            </div>

            <button type="button" className="ghost-button full-width" onClick={handleReplay} disabled={lastRoundMoves.length === 0}>
              Replay last game
            </button>
          </article>

          <article className="panel series-card">
            <div className="card-head">
              <div>
                <p className="eyebrow">Tournament</p>
                <h2>Match progress</h2>
              </div>
            </div>

            <div className="series-score">
              <div className="series-pill x">{xLabel} {seriesScore.X}</div>
              <div className="series-separator">—</div>
              <div className="series-pill o">{oLabel} {seriesScore.O}</div>
            </div>

            <p className="series-note">
              {settings.tournamentLength === 0
                ? 'Tournament mode is off. Turn it on to play a best-of series.'
                : `First to ${neededSeriesWins} wins takes the match.`}
            </p>
          </article>
        </aside>
      </main>

      <footer className="footer-bar">
        <p>Unbeatable AI, persistent settings, undo, replay, stats, tournament mode, and accessible controls.</p>
      </footer>

      {isResultOpen && selectedResult ? (
        <div className="modal-backdrop" role="presentation">
          <section className={`result-modal panel ${selectedResult.tone}`} role="dialog" aria-modal="true" aria-labelledby="result-title">
            <p className="eyebrow">Round complete</p>
            <h2 id="result-title">{selectedResult.title}</h2>
            <p>{selectedResult.subtitle}</p>
            <div className="modal-stats">
              <div>
                <span>Moves</span>
                <strong>{moveHistory.length}</strong>
              </div>
              <div>
                <span>Duration</span>
                <strong>{formatDuration(Date.now() - roundStartRef.current)}</strong>
              </div>
              <div>
                <span>Tournament</span>
                <strong>{settings.tournamentLength ? `${seriesScore.X} - ${seriesScore.O}` : 'Off'}</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="primary-button" onClick={handleResetRound}>
                Play again
              </button>
              <button type="button" className="secondary-button" onClick={handleNewGame}>
                New game
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default App;
