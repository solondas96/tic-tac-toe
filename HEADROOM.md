# Headroom Token Optimization Setup

## Overview

This project uses **Headroom** to optimize token usage when working with AI coding agents (Claude Code, Cursor, Codex, Cline, etc.). Headroom compresses context before it reaches the LLM, reducing token costs by 15-20% for coding tasks while maintaining accuracy.

## Quick Start

### 1. Install Headroom

```bash
# Global CLI tool (recommended)
uv tool install --python 3.13 "headroom-ai[all]"

# Or via pip
pip install "headroom-ai[all]"

# Or via npm (TypeScript SDK only)
npm install headroom-ai
```

**First time?** After install, verify it works:
```bash
headroom --version
headroom doctor
```

### 2. Wrap Your Coding Agent

Choose your agent and wrap it with Headroom:

#### Claude Code (VS Code)
```bash
headroom wrap claude
```
This starts a local Headroom proxy and launches Claude Code configured to use it.

#### Cursor
```bash
headroom wrap cursor
```

#### Codex / GitHub Copilot CLI
```bash
headroom wrap codex
headroom wrap copilot
```

#### Cline (VS Code)
```bash
headroom wrap cline
```

#### Continue.dev
```bash
headroom wrap continue
```

#### OpenClaw / OpenCode / OpenHands / Other Agents
```bash
headroom wrap <agent-name>
```

**Full agent matrix:** https://github.com/headroomlabs-ai/headroom#agent-compatibility-matrix

### 3. Verify Compression Is Working

While a wrapped agent is running, check savings in real-time:

```bash
# Live dashboard (requires proxy running)
headroom dashboard

# Health check
headroom doctor

# View recent savings
headroom perf
```

## Configuration

### Global Settings (`.headroom`)

Edit [.headroom](.headroom) to configure:
- **Compression mode**: `aggressive` (default) or `conservative`
- **Content routing**: Smart routing for JSON, code, and text
- **Output shaping**: Trim verbose model responses
- **Memory**: Cross-agent memory deduplication

### Local Overrides (`.headroom.local`)

Edit [.headroom.local](.headroom.local) for your local development preferences:
- Turn compression on/off for debugging
- Adjust verbosity level
- Configure output token reduction

**Note:** `.headroom.local` is gitignored and personal to your machine.

## Modes

### Wrap (Recommended for Development)
```bash
headroom wrap claude
```
- Starts a local Headroom proxy
- Wraps your coding agent
- Handles all compression automatically
- Full agent integration

### Proxy (Manual Setup)
```bash
headroom proxy --port 8787
```
Run this in a separate terminal, then configure your agent to use `http://localhost:8787` as a proxy. Useful for:
- Multiple agents sharing one proxy
- Manual proxy control
- Integration with existing setups

### Library (Inline Compression)
```python
from headroom import compress

# Python usage
compressed = compress(messages)
```

```typescript
import { compress } from 'headroom-ai';

// TypeScript usage
const compressed = await compress(messages);
```

## Environment Variables

Configure Headroom behavior via environment variables:

```bash
# Output token reduction (trim model verbosity)
export HEADROOM_OUTPUT_SHAPER=1

# Verbosity level: verbose | normal | concise | terse
export HEADROOM_OUTPUT_VERBOSITY=concise

# Measure output savings with 10% control group
export HEADROOM_OUTPUT_HOLDOUT=0.1

# Disable compression (debug mode)
export HEADROOM_COMPRESSION=off

# Disable update checks
export HEADROOM_UPDATE_CHECK=off
```

## What Gets Compressed?

Headroom intelligently compresses everything flowing through the proxy:

✅ **Tool outputs** — file reads, command outputs, logs
✅ **Code** — AST-aware compression preserves semantics
✅ **JSON data** — 60-95% reduction
✅ **Conversation history** — removes redundant context
✅ **RAG chunks** — retrieval results
✅ **Error messages** — stack traces and logs
✅ **Markdown** — documentation and comments

## Savings Estimates

Typical savings when working on this project:

| Task | Input Reduction | Output Reduction |
|------|------------------|------------------|
| Code search | 85-92% | 20-30% |
| Debugging | 70-85% | 25-35% |
| Documentation | 40-60% | 10-20% |
| Quick edits | 15-30% | 5-15% |

## Unwrap an Agent

To remove Headroom from a wrapped agent:

```bash
headroom unwrap claude
headroom unwrap cursor
# etc.
```

The agent returns to normal, no changes to your environment.

## Learning & Corrections

Headroom can mine your past sessions to learn from mistakes:

```bash
# Preview what it found (dry run)
headroom learn --verbosity

# Save corrections to CLAUDE.local.md (gitignored)
headroom learn --verbosity --apply

# Or save to shared team file
headroom learn --target CLAUDE.md
```

This helps Headroom (and your agents) avoid repeated mistakes.

## Shared Proxy (Team Setup)

Run one Headroom proxy for multiple agents:

```bash
# Terminal 1: Start shared proxy
headroom proxy --port 8787

# Terminal 2: Configure agent(s) to use proxy
export HEADROOM_PROXY_URL=http://localhost:8787

# Then launch your agents normally
```

All agents share the same compression and memory context.

## Troubleshooting

### Proxy won't start
```bash
# Check if port is in use
lsof -i :8787

# Use different port
headroom proxy --port 8788
```

### No compression happening
```bash
# Verify proxy is working
headroom doctor

# Check settings
export HEADROOM_DEBUG=1
headroom proxy --port 8787
```

### Compression disabled accidentally
```bash
# Re-enable
export HEADROOM_COMPRESSION=on
headroom proxy --port 8787

# Or edit .headroom.local
# Set enabled = true
```

### SSL/TLS errors (corporate networks)
```bash
# Trust corporate CA
export HEADROOM_TLS_STRICT=0
pip install "headroom-ai[all]"
```

## Performance Impact

- **Zero added latency** — compression happens locally, in parallel
- **~50ms startup** — proxy initialization
- **~10-50ms per request** — compression overhead (negligible)
- **100-800ms AI response** — unchanged (model inference)

Result: Same speed, far fewer tokens.

## Cost Savings Example

For a typical developer working with Claude Opus (expensive output tokens):

| Without Headroom | With Headroom | Savings |
|------------------|---------------|---------|
| ~50,000 tokens/day | ~40,000 tokens/day | 20% |
| $0.50/day | $0.40/day | $0.10/day |
| $3/week | $2.40/week | $0.60/week |
| $12/month | $9.60/month | $2.40/month |

**Across a team of 10 developers: $24/month → $192/year**

## MCP Server Mode

Use Headroom as an MCP (Model Context Protocol) server for Codex, Claude, or other MCP clients:

```bash
# Start MCP server
headroom mcp serve

# Then configure your MCP client to connect to:
# command = "headroom"
# args = ["mcp", "serve"]
```

Available MCP tools:
- `headroom_compress` — compress context
- `headroom_retrieve` — retrieve cached originals (CCR)
- `headroom_stats` — compression statistics

## Reversible Compression (CCR)

By default, Headroom stores originals locally via **Reversible Compression (CCR)**. If the model needs full context:

```python
# Model calls headroom_retrieve automatically
# or you can retrieve manually:
original = headroom_retrieve(compressed_id)
```

TTL (time-to-live): 24 hours (configurable in [.headroom](.headroom))

## Links & Resources

- **Docs**: https://headroom-docs.vercel.app/docs
- **GitHub**: https://github.com/headroomlabs-ai/headroom
- **Discord**: https://discord.gg/yRmaUNpsPJ
- **HuggingFace Model**: https://huggingface.co/chopratejas/kompress-v2-base

## Next Steps

1. **Install Headroom**: `uv tool install --python 3.13 "headroom-ai[all]"`
2. **Wrap your agent**: `headroom wrap claude` (or your tool)
3. **Verify**: `headroom doctor`
4. **Monitor**: `headroom dashboard`

---

**Questions?** Check [.headroom.local](.headroom.local) for local configuration, or visit the [Headroom Discord](https://discord.gg/yRmaUNpsPJ).
