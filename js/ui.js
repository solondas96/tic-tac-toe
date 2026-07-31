/**
 * UI Module
 * 
 * Handles all DOM manipulation, event handling, and user interaction.
 * Pure presentation layer - never contains game logic.
 * Queries the game engine for state, never modifies state directly.
 * 
 * Responsibilities:
 * - Rendering board state to DOM
 * - Capturing user input (cell clicks, button clicks)
 * - Triggering game engine actions
 * - Displaying game status and messages
 * - Managing theme (light/dark mode)
 * - Persisting user preferences (theme choice)
 * 
 * @module UI
 */

const UI = (() => {
    // ========================================================================
    // CONSTANTS
    // ========================================================================

    /** Local storage key for theme preference */
    const THEME_STORAGE_KEY = 'tic-tac-toe-theme';

    /** Theme options */
    const THEME = {
        LIGHT: 'light',
        DARK: 'dark',
    };

    /** Theme icon emojis */
    const THEME_ICONS = {
        [THEME.LIGHT]: '☀️',
        [THEME.DARK]: '🌙',
    };

    // ========================================================================
    // PRIVATE STATE
    // ========================================================================

    /** Cached DOM element references - stored on init */
    let domElements = {
        gameBoard: null,
        cells: null,
        statusMessage: null,
        statusText: null,
        resetBtn: null,
        themeToggle: null,
        themeIcon: null,
    };

    // ========================================================================
    // PRIVATE: DOM INITIALIZATION
    // ========================================================================

    /**
     * Cache all necessary DOM elements on initialization.
     * Doing this once prevents repeated querySelector calls.
     * Fails early if expected elements don't exist.
     */
    const cacheElements = () => {
        domElements.gameBoard = document.getElementById('gameBoard');
        domElements.cells = document.querySelectorAll('.cell');
        domElements.statusMessage = document.getElementById('statusMessage');
        domElements.statusText = domElements.statusMessage?.querySelector('.status-text');
        domElements.resetBtn = document.getElementById('resetBtn');
        domElements.themeToggle = document.getElementById('themeToggle');
        domElements.themeIcon = domElements.themeToggle?.querySelector('.theme-icon');

        // Verify all elements are present
        const required = ['gameBoard', 'cells', 'statusMessage', 'resetBtn', 'themeToggle'];
        const missing = required.filter(name => !domElements[name]);

        if (missing.length > 0) {
            throw new Error(`UI: Missing required elements: ${missing.join(', ')}`);
        }
    };

    /**
     * Attach all event listeners to DOM.
     * Uses event delegation where possible for efficiency.
     */
    const attachEventListeners = () => {
        // Board: click delegation - single listener for 9 cells
        domElements.gameBoard.addEventListener('click', handleCellClick);

        // Controls
        domElements.resetBtn.addEventListener('click', handleResetClick);
        domElements.themeToggle.addEventListener('click', handleThemeToggle);
    };

    // ========================================================================
    // PRIVATE: EVENT HANDLERS
    // ========================================================================

    /**
     * Handle cell click event.
     * Uses event delegation - clicked element bubbles up from .cell.
     * 
     * @param {Event} e - Click event
     */
    const handleCellClick = (e) => {
        // Event delegation: find the .cell that was clicked
        const cell = e.target.closest('.cell');
        if (!cell) {
            return;
        }

        const index = parseInt(cell.dataset.index, 10);

        // Only allow human player to click during their turn
        if (!Game.isActive() || Game.getCurrentPlayer() !== Game.PLAYER.HUMAN) {
            return;
        }

        // Attempt move in game engine
        if (!Game.makeMove(index)) {
            // Invalid move (cell occupied or out of range)
            return;
        }

        // Move was successful
        updateBoard();

        // Check if game ended
        const status = Game.checkGameStatus();
        if (status.gameOver) {
            endGame(status);
        } else {
            // Human played, now AI's turn
            setTimeout(() => playAI(), 300);
        }
    };

    /**
     * Handle reset button click.
     * Starts a new game.
     */
    const handleResetClick = () => {
        Game.reset();
        clearBoard();
        updateBoard();
        domElements.statusMessage.className = 'status-message';
    };

    /**
     * Handle theme toggle button click.
     * Switches between light and dark mode.
     */
    const handleThemeToggle = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
        setTheme(newTheme);
    };

    // ========================================================================
    // PRIVATE: GAME FLOW
    // ========================================================================

    /**
     * Trigger AI move asynchronously.
     * Waits for AI decision, applies it, and updates board.
     */
    const playAI = async () => {
        if (!AI.shouldPlay()) {
            return;
        }

        const move = await AI.playMove(500);
        if (move !== null) {
            updateBoard();

            const status = Game.checkGameStatus();
            if (status.gameOver) {
                endGame(status);
            }
        }
    };

    /**
     * End game - display result and disable further moves.
     * 
     * @param {Object} status - Result from Game.checkGameStatus()
     */
    const endGame = (status) => {
        let message = '';
        let messageClass = 'status-message';

        if (status.isDraw) {
            message = "It's a Draw! 🤝";
            messageClass += ' draw';
        } else if (status.winner === Game.PLAYER.HUMAN) {
            message = "You Won! 🎉";
            messageClass += ' winner';
        } else if (status.winner === Game.PLAYER.AI) {
            message = "AI Won! 🤖";
        }

        domElements.statusText.textContent = message;
        domElements.statusMessage.className = messageClass;

        // Highlight winning cells with animation
        if (status.winningCells.length > 0) {
            status.winningCells.forEach(index => {
                domElements.cells[index].classList.add('winning');
            });
        }

        // Disable all cells
        domElements.cells.forEach(cell => {
            cell.disabled = true;
        });
    };

    // ========================================================================
    // PRIVATE: BOARD RENDERING
    // ========================================================================

    /**
     * Update board display to match game state.
     * Renders all cells and updates status message.
     */
    const updateBoard = () => {
        const board = Game.getBoard();

        domElements.cells.forEach((cell, index) => {
            const value = board[index];
            cell.textContent = value;
            cell.className = 'cell';

            // Add semantic class for styling and ARIA
            if (value === Game.PLAYER.HUMAN) {
                cell.classList.add('x');
                cell.setAttribute('aria-label', `Cell ${index + 1}, X`);
            } else if (value === Game.PLAYER.AI) {
                cell.classList.add('o');
                cell.setAttribute('aria-label', `Cell ${index + 1}, O`);
            } else {
                cell.setAttribute('aria-label', `Cell ${index + 1}`);
            }

            cell.disabled = !Game.isActive();
        });

        updateStatus();
    };

    /**
     * Clear all cells from board display.
     * Used when starting a new game.
     */
    const clearBoard = () => {
        domElements.cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
            cell.classList.remove('winning');
        });

        // Re-enable all cells
        domElements.cells.forEach(cell => {
            cell.disabled = false;
        });
    };

    /**
     * Update status message based on current game state.
     * Only updates if game is still active.
     */
    const updateStatus = () => {
        if (!Game.isActive()) {
            return;
        }

        const player = Game.getCurrentPlayer();
        const message = player === Game.PLAYER.HUMAN
            ? "Your turn! You are X ✋"
            : "AI is thinking... 🤔";

        domElements.statusText.textContent = message;
    };

    // ========================================================================
    // PRIVATE: THEME MANAGEMENT
    // ========================================================================

    /**
     * Initialize theme system.
     * Checks localStorage, system preference, falls back to light.
     */
    const initTheme = () => {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        let theme = savedTheme || (prefersDark ? THEME.DARK : THEME.LIGHT);
        setTheme(theme);
    };

    /**
     * Set theme and persist choice.
     * 
     * @param {string} theme - 'light' or 'dark'
     */
    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        updateThemeIcon(theme);
    };

    /**
     * Update theme toggle button icon.
     * 
     * @param {string} theme - Current theme
     */
    const updateThemeIcon = (theme) => {
        domElements.themeIcon.textContent = THEME_ICONS[theme];
    };

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    /**
     * Initialize UI system.
     * Called automatically when DOM is ready.
     * Sets up cache, event listeners, theme, and initial board state.
     */
    const init = () => {
        cacheElements();
        attachEventListeners();
        initTheme();
        startNewGame();
    };

    /**
     * Start a new game (public API for external calls).
     * Resets board display and game state, updates UI.
     */
    const startNewGame = () => {
        Game.init();
        clearBoard();
        updateBoard();
        domElements.statusMessage.className = 'status-message';
    };

    /**
     * Update board display (public API if needed externally).
     * Called after game state changes.
     */
    const updateBoardDisplay = () => {
        updateBoard();
    };

    // ========================================================================
    // AUTO-INITIALIZATION
    // ========================================================================

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================================================
    // EXPORTS
    // ========================================================================

    return {
        init,
        startNewGame,
        updateBoardDisplay,
    };
})();
