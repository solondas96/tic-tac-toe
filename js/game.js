/**
 * Game Engine Module
 * 
 * Manages the tic-tac-toe game state, validates moves, and detects win/draw conditions.
 * This is the single source of truth for game state - all business logic is isolated here.
 * UI layer must never directly modify state, only query via provided methods.
 * 
 * @module Game
 */

const Game = (() => {
    // ========================================================================
    // CONSTANTS
    // ========================================================================

    /** 9-cell board indexed 0-8 in reading order (top-left to bottom-right) */
    const BOARD_SIZE = 9;

    /** Player markers */
    const PLAYER = {
        HUMAN: 'X',
        AI: 'O',
    };

    /** All possible winning combinations (as indices into board array) */
    const WIN_PATTERNS = [
        // Rows
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        // Columns
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        // Diagonals
        [0, 4, 8],
        [2, 4, 6],
    ];

    // ========================================================================
    // PRIVATE STATE
    // ========================================================================

    /** Board state: 9-element array where '' = empty, 'X' = human, 'O' = AI */
    let board = Array(BOARD_SIZE).fill('');

    /** Whose turn: 'X' (human) or 'O' (AI) */
    let currentPlayer = PLAYER.HUMAN;

    /** Whether game is accepting moves */
    let gameActive = true;

    // ========================================================================
    // PUBLIC API: GAME LIFECYCLE
    // ========================================================================

    /**
     * Initialize a new game.
     * Resets board, sets human as first player, activates game.
     * 
     * @returns {Object} Initial game state
     */
    const init = () => {
        board = Array(BOARD_SIZE).fill('');
        currentPlayer = PLAYER.HUMAN;
        gameActive = true;
        return getState();
    };

    /**
     * Reset game to initial state (alias for init).
     * Used when player clicks "New Game" button.
     * 
     * @returns {Object} Initial game state
     */
    const reset = () => init();

    // ========================================================================
    // PUBLIC API: MOVE HANDLING
    // ========================================================================

    /**
     * Attempt to make a move at the specified board index.
     * Validates the move, applies it if valid, updates game state.
     * 
     * @param {number} index - Board position (0-8)
     * @returns {boolean} True if move was valid and applied, false otherwise
     * 
     * @example
     * // Make a move
     * if (Game.makeMove(4)) {
     *   console.log('Move accepted at center');
     * } else {
     *   console.log('Cell already occupied or game over');
     * }
     */
    const makeMove = (index) => {
        // Validation: fail fast
        if (!gameActive) {
            return false;
        }

        if (index < 0 || index >= BOARD_SIZE) {
            return false;
        }

        if (board[index] !== '') {
            return false;
        }

        // Apply move
        board[index] = currentPlayer;

        // Check for terminal state (win or draw)
        const status = checkGameStatus();
        if (status.gameOver) {
            gameActive = false;
        } else {
            // Switch player
            currentPlayer = currentPlayer === PLAYER.HUMAN 
                ? PLAYER.AI 
                : PLAYER.HUMAN;
        }

        return true;
    };

    // ========================================================================
    // PUBLIC API: GAME STATE QUERIES
    // ========================================================================

    /**
     * Get a snapshot of current game state.
     * Returns a copy to prevent external mutation of internal state.
     * 
     * @returns {Object} {
     *   board: string[],          // Copy of 9-cell board
     *   currentPlayer: string,    // 'X' or 'O'
     *   gameActive: boolean,      // Whether game accepts moves
     *   isEmpty: boolean,         // Whether board is empty
     * }
     */
    const getState = () => ({
        board: [...board],
        currentPlayer,
        gameActive,
        isEmpty: board.every(cell => cell === ''),
    });

    /**
     * Get current board state.
     * 
     * @returns {string[]} Copy of board array (9 elements)
     */
    const getBoard = () => [...board];

    /**
     * Get whose turn it is.
     * 
     * @returns {string} 'X' (human) or 'O' (AI)
     */
    const getCurrentPlayer = () => currentPlayer;

    /**
     * Check if game is still accepting moves.
     * 
     * @returns {boolean} True if game is active
     */
    const isActive = () => gameActive;

    /**
     * Get indices of all empty cells.
     * Used by AI to determine possible moves.
     * 
     * @returns {number[]} Array of empty cell indices (0-8)
     * 
     * @example
     * const moves = Game.getAvailableMoves();
     * // Returns [3, 5, 7] if those cells are empty
     */
    const getAvailableMoves = () => {
        return board
            .map((cell, index) => (cell === '' ? index : null))
            .filter(index => index !== null);
    };

    /**
     * Check if a specific cell is empty.
     * Low-level query used internally and by AI.
     * 
     * @param {number} index - Cell index (0-8)
     * @returns {boolean} True if cell is empty
     */
    const isEmpty = (index) => {
        if (index < 0 || index >= BOARD_SIZE) {
            return false;
        }
        return board[index] === '';
    };

    // ========================================================================
    // PUBLIC API: GAME STATUS
    // ========================================================================

    /**
     * Check if game is over and determine outcome.
     * Checks all win patterns first, then draw condition.
     * 
     * @returns {Object} {
     *   gameOver: boolean,        // Is game finished?
     *   winner: string|null,      // 'X', 'O', or null (draw)
     *   isDraw: boolean,          // Did game end in draw?
     *   winningCells: number[],   // Indices of winning cells (if win)
     * }
     * 
     * @example
     * const status = Game.checkGameStatus();
     * if (status.winner === 'X') {
     *   console.log('Human won!');
     * } else if (status.isDraw) {
     *   console.log('Draw!');
     * }
     */
    const checkGameStatus = () => {
        // Check for win: all 8 patterns
        for (let pattern of WIN_PATTERNS) {
            const [a, b, c] = pattern;
            const cellA = board[a];

            if (cellA !== '' && cellA === board[b] && board[b] === board[c]) {
                return {
                    gameOver: true,
                    winner: cellA,
                    isDraw: false,
                    winningCells: pattern,
                };
            }
        }

        // Check for draw: board full with no winner
        const isBoardFull = board.every(cell => cell !== '');
        if (isBoardFull) {
            return {
                gameOver: true,
                winner: null,
                isDraw: true,
                winningCells: [],
            };
        }

        // Game continues
        return {
            gameOver: false,
            winner: null,
            isDraw: false,
            winningCells: [],
        };
    };

    // ========================================================================
    // PUBLIC API: EXPORTS
    // ========================================================================

    return {
        // Lifecycle
        init,
        reset,
        
        // Move handling
        makeMove,
        
        // State queries
        getState,
        getBoard,
        getCurrentPlayer,
        isActive,
        getAvailableMoves,
        isEmpty,
        
        // Game status
        checkGameStatus,
        
        // Constants (for AI and UI)
        WIN_PATTERNS,
        PLAYER,
        BOARD_SIZE,
    };
})();
