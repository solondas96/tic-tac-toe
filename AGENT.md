# Tic-Tac-Toe Engineering Standards & Architecture

## Project Philosophy

This is a production-quality vanilla JavaScript game demonstrating best practices in:
- **Readability**: Code understandable in under 5 minutes
- **Maintainability**: Simple to extend or modify
- **Performance**: Efficient without premature optimization
- **Accessibility**: WCAG 2.1 AA compliant
- **Testability**: Clear, isolated business logic

---

## Architecture Overview

### Separation of Concerns

The codebase is organized into three distinct layers:

```
┌─────────────────────────────────────────────┐
│  UI Layer (ui.js)                           │
│  ├─ DOM manipulation & updates              │
│  ├─ Event handling                          │
│  ├─ Theme management                        │
│  └─ Status messaging                        │
├─────────────────────────────────────────────┤
│  Game Engine (game.js)                      │
│  ├─ Board state management                  │
│  ├─ Move validation                         │
│  ├─ Win/draw detection                      │
│  └─ Game rules enforcement                  │
├─────────────────────────────────────────────┤
│  AI Player (ai.js)                          │
│  ├─ Minimax algorithm                       │
│  ├─ Move scoring                            │
│  └─ Optimal move selection                  │
├─────────────────────────────────────────────┤
│  Styling (styles.css)                       │
│  ├─ Design tokens (CSS variables)           │
│  ├─ Material Design 3 implementation        │
│  ├─ Light/dark themes                       │
│  └─ Responsive layout                       │
└─────────────────────────────────────────────┘
```

**Key Rule**: Business logic never depends on UI. UI queries engine for state, never directly manipulates it.

---

## Code Quality Standards

### 1. Naming Conventions

**Variables & Functions**: `camelCase`
```javascript
const currentPlayer = 'X';
function makeMove(index) { }
```

**Constants**: `UPPER_SNAKE_CASE`
```javascript
const BOARD_SIZE = 9;
const WIN_PATTERNS = [/* */];
const AI_PLAYER = 'O';
```

**CSS Variables**: `--kebab-case`
```css
--color-primary: #6200ea;
--spacing-lg: 1.5rem;
```

### 2. Function Design

Every function should:
- ✅ Do one thing
- ✅ Have clear purpose
- ✅ Include JSDoc comment
- ✅ Validate inputs
- ✅ Return meaningful data or void
- ✅ Avoid side effects where possible

**Good Example**:
```javascript
/**
 * Checks if the current board state is a winning position.
 * 
 * @returns {Object} {winner: 'X'|'O'|null, cells: number[]} 
 *                   winner is the player who won, cells are winning indices
 *                   Returns {winner: null, cells: []} if no win
 */
function checkForWin() {
  // Implementation
}
```

### 3. Module Pattern

All modules use the **Revealing Module Pattern**:
```javascript
const ModuleName = (() => {
  // Private state and functions (scoped to IIFE)
  const privateState = 'hidden';
  
  const privateFunction = () => {
    // Only accessible within module
  };

  // Public API
  return {
    publicMethod: () => { /* */ },
    getState: () => ({ /* */ })
  };
})();
```

**Benefits**:
- Private state is truly encapsulated
- Clear API surface (only returned methods are public)
- No global namespace pollution
- Easy to understand what's exposed

---

## Game Engine (game.js)

### State Management

The game state is the **single source of truth**:
```javascript
const state = {
  board: ['', '', '', ''],    // 9-cell array
  currentPlayer: 'X',         // Whose turn
  gameActive: true,           // Is game running
};
```

**Rule**: Never directly modify state from outside the engine. Always use provided methods.

### Win Detection

Win patterns are defined as **indices**, not positions:
```javascript
const WIN_PATTERNS = [
  [0, 1, 2],  // Top row
  [3, 4, 5],  // Middle row
  // ... etc
];
```

This makes collision detection O(8) instead of O(9²).

---

## AI Player (ai.js)

### Minimax Algorithm

The AI uses minimax with these principles:

**Scoring System**:
- AI wins: `+10 - depth` (prefers faster wins)
- AI loses: `-10 + depth` (prefers slower losses)
- Draw: `0`

**Why depth adjustment?** 
Without it, the AI would choose moves that delay loss unnecessarily. With depth weighting, it finds the fastest win or slowest loss.

**Time Complexity**: O(9!) worst case, ~10-100ms typical (pruning helps)

### Algorithm Flow

```
1. For each empty cell:
   a. Place AI piece
   b. Recursively evaluate all opponent responses
   c. Return piece
   
2. At each recursion level:
   - If terminal state (win/loss/draw), return score
   - If AI's turn, maximize score
   - If opponent's turn, minimize score
   
3. Choose move with highest score
```

---

## UI Layer (ui.js)

### Event Handling

Uses **event delegation** for efficiency:
```javascript
// Instead of attaching listeners to 9 cells:
gameBoard.addEventListener('click', handleCellClick);

// Extract the cell from the event:
const cell = e.target.closest('.cell');
```

**Benefits**:
- Single listener instead of 9
- Works with dynamic DOM
- Easier to manage lifecycle

### Theme System

Theme preference flow:
```
1. Check localStorage (persistent user choice)
   ↓ not found
2. Check system preference (prefers-color-scheme media query)
   ↓ not found
3. Default to light mode
```

CSS variables change automatically:
```css
:root { /* light mode */ }
[data-theme="dark"] { /* dark mode */ }
```

---

## CSS Architecture (styles.css)

### Organization

```css
/* ============================================
   1. CSS Variables & Themes
   ============================================ */
:root { /* light */ }
[data-theme="dark"] { /* dark */ }

/* ============================================
   2. Reset & Base Styles
   ============================================ */
* { /* normalization */ }
body { /* baseline */ }

/* ============================================
   3. Layout Components
   ============================================ */
.app { /* main structure */ }
.app-header { /* header */ }
.app-main { /* main content */ }

/* ============================================
   4. Feature Components
   ============================================ */
.game-board { /* grid */ }
.cell { /* individual cell */ }
.btn { /* buttons */ }

/* ============================================
   5. Responsive Design
   ============================================ */
@media (max-width: 640px) { /* tablet */ }
@media (max-width: 480px) { /* mobile */ }

/* ============================================
   6. Accessibility
   ============================================ */
@media (prefers-reduced-motion: reduce) { }
```

### Design Token System

All colors, spacing, shadows use CSS variables:

```css
--color-primary: #6200ea;      /* semantic name */
--color-primary-dark: #3700b3; /* variant */
--spacing-md: 1rem;            /* rhythm scale */
--shadow-md: 0 4px 8px rgba(); /* depth */
```

**Why?** Single source of truth for design tokens. Theme switching requires only 1 CSS rule change.

---

## Testing Strategy

### Manual Testing Checklist

Before deployment, verify:

**Game Logic**:
- [ ] AI wins against human attempts
- [ ] Win detection for all 8 patterns
- [ ] Draw detection works
- [ ] Reset clears board

**UI/UX**:
- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] Theme persists on reload
- [ ] All buttons are clickable
- [ ] Hover/focus states visible

**Accessibility**:
- [ ] Tab navigation works
- [ ] ARIA labels present
- [ ] Color contrast ≥4.5:1
- [ ] Works with keyboard only
- [ ] Works on mobile (<600px)

**Performance**:
- [ ] Loads in <1 second
- [ ] AI move <1 second
- [ ] No console errors
- [ ] Works offline

---

## Common Patterns

### Pattern 1: Validating User Input

```javascript
/**
 * Makes a move if valid, returns success status.
 * Validates: index in range, cell empty, game active.
 */
const makeMove = (index) => {
  // Fail fast - validate preconditions
  if (!gameActive || index < 0 || index > 8 || board[index] !== '') {
    return false;
  }
  
  // Now safe to make move
  board[index] = currentPlayer;
  return true;
};
```

### Pattern 2: State Queries

```javascript
/**
 * Returns current state without exposing internals.
 * Callers get a snapshot, can't modify original.
 */
const getState = () => ({
  board: [...board],              // Copy, not reference
  currentPlayer,
  gameActive,
  isEmpty: board.every(c => c === ''),
});
```

### Pattern 3: Pure Functions

```javascript
/**
 * Pure function: same input → same output, no side effects.
 * Makes testing trivial - just check input/output.
 */
const evaluateBoard = (boardState) => {
  for (let pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern;
    if (boardState[a] !== '' &&
        boardState[a] === boardState[b] &&
        boardState[b] === boardState[c]) {
      return { winner: boardState[a], isDraw: false };
    }
  }
  
  if (boardState.every(cell => cell !== '')) {
    return { winner: null, isDraw: true };
  }
  
  return { winner: null, isDraw: false };
};
```

### Pattern 4: Async Operations with Delays

```javascript
/**
 * Plays AI move after delay for better UX.
 * Delays human perception of "instant" AI response.
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
```

---

## Performance Considerations

### Wins

✅ **CSS Variables**: One variable change updates entire theme
✅ **Event Delegation**: 1 listener instead of 9
✅ **Pure Functions**: No hidden dependencies, easier to optimize
✅ **Minimal DOM Queries**: Cache selectors on init
✅ **Minimax Pruning**: AI responds quickly despite recursion

### Potential Bottlenecks (Mitigated)

⚠️ **Recursive Minimax**: Could be expensive on 9² board
- Solution: Depth-first pruning, typical <100ms
- Limit: Only runs when AI plays, ~1x per user move

⚠️ **DOM Repaints**: Updating cells one-by-one
- Solution: Event delegation, minimal reflows
- Typical: <5ms for full board update

---

## Extensibility Examples

### Example 1: Add Difficulty Levels

```javascript
// In ai.js, modify scoring:
const DIFFICULTY = {
  easy: 0.5,      // Make mistakes ~50% of time
  medium: 0.9,    // Make mistakes ~10% of time
  hard: 1.0,      // Never mistakes (current)
};

const getBestMove = (difficulty = DIFFICULTY.hard) => {
  // If random < (1 - difficulty), make random move
  if (Math.random() < (1 - difficulty)) {
    return Game.getAvailableMoves()[
      Math.floor(Math.random() * Game.getAvailableMoves().length)
    ];
  }
  // Otherwise use minimax as normal
};
```

### Example 2: Add Game Statistics

```javascript
// In game.js, track stats:
const stats = {
  gamesPlayed: 0,
  humanWins: 0,
  aiWins: 0,
  draws: 0,
};

const recordWin = (winner) => {
  stats.gamesPlayed++;
  if (winner === 'X') stats.humanWins++;
  else if (winner === 'O') stats.aiWins++;
};

const getStats = () => ({ ...stats }); // Return copy
```

### Example 3: Add Move History

```javascript
// Track moves for undo/replay
const moveHistory = [];

const makeMove = (index) => {
  if (!Game.makeMove(index)) return false;
  
  moveHistory.push({
    index,
    player: currentPlayer,
    timestamp: Date.now(),
  });
  
  return true;
};

const getMoveHistory = () => [...moveHistory];
```

---

## Review Checklist

Before submitting code:

### Readability
- [ ] Variable names are descriptive (no `x`, `y`, `tmp`)
- [ ] Function names describe what they do
- [ ] No single function exceeds 50 lines
- [ ] No nesting deeper than 3 levels
- [ ] Comments explain "why", not "what"

### Correctness
- [ ] Edge cases handled (empty board, full board, etc.)
- [ ] No off-by-one errors
- [ ] All code paths tested manually
- [ ] Error handling is explicit

### Performance
- [ ] No unnecessary loops
- [ ] No O(n²) algorithms where O(n) exists
- [ ] DOM queries cached, not repeated
- [ ] No memory leaks (event listener cleanup)

### Maintainability
- [ ] No duplicated logic
- [ ] Pure functions where possible
- [ ] Business logic isolated from UI
- [ ] Configuration in constants, not hardcoded
- [ ] Clear module boundaries

### Accessibility
- [ ] ARIA labels on interactive elements
- [ ] Semantic HTML (button, not div with click handler)
- [ ] Keyboard navigation works
- [ ] Color contrast ≥4.5:1
- [ ] Focus indicators visible

---

## Recommended Tools & Workflows

### Development
```bash
# Linting
npx eslint js/ --fix

# Format
npx prettier --write .

# Type checking (via comments)
npx tsc --allowJs --noEmit
```

### Local Server
```bash
python3 -m http.server 5173
# or
npx http-server -p 5173
```

### Debugging
```javascript
// Enable debug logging
const DEBUG = true;

const log = (msg, data) => {
  if (DEBUG) console.log(`[Game] ${msg}`, data || '');
};
```

---

## Decision Log

### Why Vanilla JavaScript?

- **No build step required** → deploy directly
- **No dependencies** → smaller, faster, no supply chain risk
- **Teaches fundamentals** → clear separation of concerns
- **GitHub Pages compatible** → free hosting

### Why Minimax Over AlphaBeta?

- **Simplicity** → easier to understand and maintain
- **Sufficient** → 9! = 362,880 positions is manageable
- **Pruning** → O(9!) collapses to ~10-100ms in practice

### Why CSS Variables Over Preprocessor?

- **Native browser support** → no build step
- **Dynamic theming** → runtime changes, not compile-time
- **Smaller** → no extra tooling needed

---

## Resources

- [MDN: Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Web.dev: Patterns](https://web.dev/patterns/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design 3](https://m3.material.io/)

---

## Maintainers

This codebase is maintained with these principles to ensure:
- **Long-term viability**: Easy to hand off to new maintainers
- **Clarity**: Any engineer can understand it in 5 minutes
- **Correctness**: Obvious where bugs can hide
- **Performance**: Fast without being clever

When modifying code, prioritize clarity over brevity.
