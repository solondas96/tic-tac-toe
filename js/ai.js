/**
 * AI Player Module
 * 
 * Implements the minimax algorithm for unbeatable AI opponent.
 * The AI can never lose - at best, the human can force a draw.
 * 
 * Algorithm: Minimax with depth weighting
 * - Evaluates all possible future game states recursively
 * - Scores outcomes: AI win (+10), AI loss (-10), draw (0)
 * - Weights by depth: prefers faster wins, slower losses
 * - Time: O(9!) worst case, ~50-500ms typical
 * 
 * @module AI
 */

const AI = (() => {
    // ========================================================================
    // CONSTANTS
    // ========================================================================

    /** Position scores for minimax evaluation */
    const SCORE = {
        AI_WIN: 10,
        AI_LOSS: -10,
        DRAW: 0,
    };

    // ========================================================================
    // PRIVATE FUNCTIONS
    // ========================================================================

    /**
     * Evaluate a board state for terminal conditions (win/loss/draw).
     * Pure function - no side effects.
     * 
     * @param {string[]} boardState - 9-element board array
     * @returns {Object} {winner: 'X'|'O'|null, isDraw: boolean}
     */
    const evaluateBoard = (boardState) => {
        // Check for win in any of the 8 patterns
        for (let pattern of Game.WIN_PATTERNS) {
            const [a, b, c] = pattern;
            const cellValue = boardState[a];

            if (cellValue !== '' && 
                cellValue === boardState[b] && 
                boardState[b] === boardState[c]) {
                return {
                    winner: cellValue,
                    isDraw: false,
                };
            }
        }

        // Check for draw: all cells filled, no winner
        const isBoardFull = boardState.every(cell => cell !== '');
        if (isBoardFull) {
            return {
                winner: null,
                isDraw: true,
            };
        }

        // Game continues
        return {
            winner: null,
            isDraw: false,
        };
    };

    /**
     * Minimax algorithm with depth weighting.
     * Recursively evaluates all possible game continuations.
     * 
     * Score adjustments by depth:
     * - AI wins: score decreases by depth (prefer faster wins)
     * - AI losses: score increases by depth (prefer slower losses)
     * - This creates a natural preference for ending the game quickly,
     *   but not at the expense of losing faster
     * 
     * @param {string[]} boardState - Current board state
     * @param {number} depth - Recursion depth (0 = terminal)
     * @param {boolean} isMaximizing - True if AI's turn, false if human's
     * @returns {number} Score of this position from AI's perspective
     */
    const minimax = (boardState, depth, isMaximizing) => {
        // Base case: check if game is over
        const result = evaluateBoard(boardState);

        // Terminal states with depth weighting
        if (result.winner === Game.PLAYER.AI) {
            // AI wins faster = better
            return SCORE.AI_WIN - depth;
        }
        if (result.winner === Game.PLAYER.HUMAN) {
            // AI loses slower = better
            return SCORE.AI_LOSS + depth;
        }
        if (result.isDraw) {
            return SCORE.DRAW;
        }

        // Recursive case
        if (isMaximizing) {
            // AI's turn: choose move that maximizes score
            let bestScore = -Infinity;
            
            for (let i = 0; i < Game.BOARD_SIZE; i++) {
                if (boardState[i] === '') {
                    boardState[i] = Game.PLAYER.AI;
                    const score = minimax(boardState, depth + 1, false);
                    boardState[i] = ''; // Undo
                    bestScore = Math.max(score, bestScore);
                }
            }
            
            return bestScore;
        } else {
            // Human's turn: choose move that minimizes AI's score
            let bestScore = Infinity;
            
            for (let i = 0; i < Game.BOARD_SIZE; i++) {
                if (boardState[i] === '') {
                    boardState[i] = Game.PLAYER.HUMAN;
                    const score = minimax(boardState, depth + 1, true);
                    boardState[i] = ''; // Undo
                    bestScore = Math.min(score, bestScore);
                }
            }
            
            return bestScore;
        }
    };

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    /**
     * Find the optimal move for AI.
     * Evaluates all legal moves and returns the one with highest score.
     * 
     * @returns {number} Best move index (0-8)
     * 
     * @example
     * const move = AI.getBestMove();
     * Game.makeMove(move);  // Apply the move
     */
    const getBestMove = () => {
        const boardState = Game.getBoard();
        const availableMoves = Game.getAvailableMoves();

        let bestScore = -Infinity;
        let bestMove = availableMoves[0];

        // Try each possible move
        for (let move of availableMoves) {
            boardState[move] = Game.PLAYER.AI;
            const score = minimax(boardState, 0, false);
            boardState[move] = '';

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    };

    /**
     * Check if it's the AI's turn to play.
     * 
     * @returns {boolean} True if AI should play next
     */
    const shouldPlay = () => {
        return Game.isActive() && Game.getCurrentPlayer() === Game.PLAYER.AI;
    };

    /**
     * Play a move with UX delay for human perception.
     * The delay makes it feel less "instant" and more like a real player.
     * 
     * @param {number} delayMs - Milliseconds to wait before playing (default: 500)
     * @returns {Promise<number|null>} Promise resolving to move index, or null if not AI's turn
     * 
     * @example
     * // Play AI move after 500ms delay
     * await AI.playMove(500);
     * 
     * // Play immediately (for testing)
     * await AI.playMove(0);
     */
    const playMove = (delayMs = 500) => {
        return new Promise((resolve) => {
            if (!shouldPlay()) {
                resolve(null);
                return;
            }

            setTimeout(() => {
                const move = getBestMove();
                Game.makeMove(move);
                resolve(move);
            }, delayMs);
        });
    };

    // ========================================================================
    // EXPORTS
    // ========================================================================

    return {
        getBestMove,
        shouldPlay,
        playMove,
    };
})();
