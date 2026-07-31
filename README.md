# XOXO

A lightweight, Material Design tic-tac-toe game with an unbeatable AI opponent using the minimax algorithm. Built with vanilla JavaScript, CSS, and HTML—no frameworks or build tools required.

## Features

✨ **Game Features**
- 3x3 grid board with interactive cells
- Two-player mode: Human (X) vs AI (O)
- AI opponent using minimax algorithm (unbeatable play)
- Automatic win/draw detection
- Game status display and reset button
- Smooth animations and visual feedback

🎨 **Design & UX**
- Material Design 3 principles
- Light and dark mode support
- Theme preference persisted in localStorage
- Respects system `prefers-color-scheme` on first load
- Fully responsive (mobile, tablet, desktop)
- Touch-friendly buttons (48px minimum)
- Smooth transitions and hover effects

♿ **Accessibility**
- ARIA labels for all interactive elements
- Keyboard navigation support
- Focus-visible states for all buttons
- Semantic HTML5 structure
- Color contrast ratios ≥4.5:1
- Respects `prefers-reduced-motion`

⚡ **Performance**
- No external dependencies
- All CSS in single file (~6KB)
- Minimal JavaScript (~8KB total)
- Loads in < 1 second
- Works offline

## How to Play

1. **Start**: Open `index.html` in a browser or run a local server
2. **Your Move**: Click any empty cell to place an X
3. **AI Response**: The AI (O) will play optimally
4. **Win Condition**: Get three in a row (horizontal, vertical, or diagonal) to win
5. **Reset**: Click "New Game" to start over

The AI is unbeatable—at best, you'll achieve a draw!

## Project Structure

```
tic-tac-toe/
├── index.html              # Semantic HTML with ARIA accessibility
├── css/
│   └── styles.css         # Material Design 3, CSS variables, themes
├── js/
│   ├── game.js            # Game engine (pure business logic)
│   ├── ai.js              # Minimax algorithm (AI player)
│   └── ui.js              # DOM & event handling (presentation layer)
├── AGENT.md               # Engineering standards & architecture
├── HEADROOM.md            # Token optimization guide
├── CLAUDE.local.md        # AI agent context (gitignored)
└── README.md              # This file
```

## Architecture

This project follows **production-quality engineering standards** with clear separation of concerns:

- **Game Engine** (`game.js`) — Pure business logic, state management, no DOM dependencies
- **AI Player** (`ai.js`) — Minimax algorithm, move evaluation, game-agnostic
- **UI Layer** (`ui.js`) — DOM manipulation, event handling, queries engine for state
- **Styling** (`styles.css`) — Material Design 3, CSS variables, responsive layout

**Key principle**: Business logic never depends on UI. The engine can be tested and used independently.

See [AGENT.md](AGENT.md) for complete engineering standards and architecture documentation.

## Getting Started

### Option 1: Direct Browser
Simply open `index.html` in your browser:
```bash
open index.html
```

### Option 2: Local Server (Recommended)

**Python 3:**
```bash
python3 -m http.server 5173
# Visit: http://localhost:5173
```

**Python 2:**
```bash
python -m SimpleHTTPServer 5173
# Visit: http://localhost:5173
```

**Node.js (using http-server):**
```bash
npx http-server -p 5173
```

## Token Optimization with Headroom (Optional)

If you're working on this project with AI coding agents (Claude Code, Cursor, Codex, Cline, etc.), you can use **Headroom** to reduce token usage by 15-20% while maintaining code quality.

### Quick Setup

```bash
# Install Headroom
uv tool install --python 3.13 "headroom-ai[all]"

# Wrap your coding agent
headroom wrap claude    # or: cursor, codex, cline, continue, etc.
```

Headroom automatically:
- Compresses tool outputs, logs, and context before reaching the LLM
- Reduces token costs without changing your workflow
- Works across multiple agents with shared memory
- Stores originals locally for retrieval when needed

### Monitor Savings

While working:
```bash
headroom dashboard          # Live savings dashboard
headroom doctor            # Health check
headroom perf              # Recent performance
```

**Full setup guide**: See [HEADROOM.md](HEADROOM.md)

## Hosting on GitHub Pages

### Setup

1. Create a new repository named `tic-tac-toe` on GitHub
2. Clone it locally and copy all files into the root:
   ```bash
   git clone https://github.com/YOUR_USERNAME/tic-tac-toe.git
   cd tic-tac-toe
   # Copy all files from this project here
   git add .
   git commit -m "Initial commit: Tic-tac-toe game"
   git push origin main
   ```

3. Enable GitHub Pages:
   - Go to repository **Settings** → **Pages**
   - Set "Source" to `main` branch, root folder
   - Save and wait ~1 minute for deployment

4. Your game is live at: `https://YOUR_USERNAME.github.io/tic-tac-toe`

### Optional: Use `/docs` folder

If you prefer to use the `/docs` folder:
1. Create a `docs/` folder in your repository
2. Copy all project files into `docs/`
3. In GitHub Settings → Pages, select "Deploy from a branch" → `main` → `/docs` folder

## Customization

### Change Colors

Edit the CSS variables in `css/styles.css`:

**Light Mode (lines 4-18):**
```css
:root {
    --color-primary: #6200ea;        /* Primary button color */
    --color-text-primary: #212121;   /* Text color */
    --bg-primary: #ffffff;           /* Background */
    /* ... more variables */
}
```

**Dark Mode (lines 21-34):**
```css
[data-theme="dark"] {
    --color-primary: #bb86fc;        /* Light indigo for dark mode */
    /* ... more variables */
}
```

### Adjust Spacing & Sizing

Modify these in `css/styles.css`:
```css
--spacing-md: 1rem;        /* General spacing */
--spacing-lg: 1.5rem;      /* Larger spacing */
--radius-md: 8px;          /* Button/cell border radius */
```

### Adjust Cell Size

In `css/styles.css`, find `.cell`:
```css
.cell {
    min-height: 100px;     /* Change this value */
    font-size: 2.5rem;     /* Change X/O size */
}
```

## Browser Support

- Chrome/Edge: ✅ Latest
- Firefox: ✅ Latest
- Safari: ✅ Latest
- Mobile Browsers: ✅ iOS Safari, Chrome Android

## Technical Details

### Game Logic (js/game.js)

- Manages board state as a 9-element array
- Detects wins by checking 8 patterns (rows, columns, diagonals)
- Detects draws when board is full with no winner
- Provides available moves list for AI

### AI Algorithm (js/ai.js)

Implements the **Minimax Algorithm**:
1. For each possible move, recursively evaluate all future game states
2. Assign scores: +10 for AI win, -10 for AI loss, 0 for draw
3. Adjust scores by depth (prefer faster wins, slower losses)
4. Choose the move with the highest score

**Complexity**: O(9!) = 362,880 operations worst-case, typically < 100ms

### UI & Theme (js/ui.js)

- Event delegation for cell clicks
- Automatic AI move after human play
- Theme persistence using `localStorage`
- Real-time status updates
- Focus management for accessibility

## Testing Checklist

- ✅ AI never loses (unbeatable)
- ✅ Win/draw detection accurate
- ✅ Light mode displays correctly
- ✅ Dark mode displays correctly
- ✅ Theme toggle persists on reload
- ✅ Responsive on mobile (<600px)
- ✅ No console errors
- ✅ All buttons are clickable & focusable
- ✅ Game playable from first click
- ✅ Keyboard navigation works

## Performance Metrics

- **Initial Load**: < 500ms
- **Game Board Load**: < 50ms
- **AI Move Time**: 100-800ms (including 500ms delay for UX)
- **Total Bundle Size**: ~14KB (HTML + CSS + JS)
- **No External Dependencies**: Pure vanilla stack

## License

MIT License - Feel free to use, modify, and share!

## Troubleshooting

### Scripts not loading?
- Check browser console (F12) for 404 errors
- Ensure you're running a local server (not opening `file://` directly)
- Verify folder structure matches project layout

### Theme not persisting?
- Check localStorage is enabled in browser settings
- Clear browser cache and reload

### AI playing slowly?
- This is normal on first move (computing optimal play)
- Subsequent moves are instant due to pruning

### Want to add features?
- See `js/game.js` for game state management
- See `js/ai.js` for AI difficulty settings
- See `css/styles.css` for styling
