# mcp-discovery

An MCP server that helps AI agents find other MCP servers.

[![CI](https://img.shields.io/github/actions/workflow/status/yksanjo/mcp-discovery/ci.yml?branch=main&label=ci)](https://github.com/yksanjo/mcp-discovery/actions)
![License](https://img.shields.io/github/license/yksanjo/mcp-discovery)
![Last Commit](https://img.shields.io/github/last-commit/yksanjo/mcp-discovery)

Ask in natural language — *"what's available for sending Slack
messages?"* — and get back ranked servers with install commands and
trust signals, instead of maintaining a hand-curated config file.

Ships with a bundled registry snapshot of **17,785 unique MCP servers**
(deduplicated from 18,366 raw records scraped 2026-02-09 from Glama.ai,
npm, GitHub topics, and awesome lists). Works fully offline with zero
API keys.

## Quick start (local mode, no keys)

```bash
git clone https://github.com/yksanjo/mcp-discovery
cd mcp-discovery
npm ci
npm run build
```

Add to Claude Code:

```bash
claude mcp add mcp-discovery -- node /path/to/mcp-discovery/dist/index.js
```

Or to Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mcp-discovery": {
      "command": "node",
      "args": ["/path/to/mcp-discovery/dist/index.js"]
    }
  }
}
```

Then ask your agent things like *"find me an MCP server for querying
Postgres"* and it will call `discover_mcp_server` and get ranked,
installable results.

## Tools

| Tool | Local mode | Hosted mode |
| --- | --- | --- |
| `discover_mcp_server` | ✅ keyword search over the bundled snapshot | ✅ semantic search (OpenAI embeddings + pgvector) |
| `get_server_metrics` | ❌ (needs live probe data) | ✅ latency / uptime / success-rate history |
| `compare_servers` | ❌ (needs live probe data) | ✅ side-by-side rankings |

In local mode, `trust_score` (0–100) is derived from GitHub stars and
results carry no latency/uptime metrics — those require the hosted
database. The two hosted-only tools fail fast with a clear message
rather than crashing.

Honest caveats about the bundled data: install commands are
best-effort from the scrape (verify before running anything),
category labels are mostly missing, and the snapshot is a point in
time — see "Refreshing the data" below.

## Hosted mode (optional)

For semantic search and live metrics you run your own backing services.
There is currently **no public hosted instance**.

Required environment variables:

```bash
SUPABASE_URL=...                  # Postgres + pgvector (schema in src/db/)
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...                # text-embedding queries
```

Setup: apply `src/db/mcp-curator-schema.sql`, then `npm run seed` and
`npm run generate-embeddings`. `DATABASE.md` documents the schema. The
REST API (`npm run start`, see `src/api.ts` and `api/` for the Vercel
entry) exposes the same search over HTTP.

## Integrations

- [`langchain/`](./langchain/) — `MCPDiscoveryTool` for LangChain
  agents (async via `aiohttp`). Targets a hosted API endpoint you
  deploy yourself.
- [AutoGPT blocks](https://github.com/Significant-Gravitas/AutoGPT/issues/11793)
  — `MCPDiscoveryBlock` / `MCPDiscoveryCategoriesBlock`.

## Refreshing the data

The scrapers live in [`scripts/`](./scripts/) (`scrape_massive.py`,
`scrape-glama.ts`, and friends). They regenerate
`data_massive/mcp_servers_all.json`, which local mode picks up
automatically. You can also point `MCP_DISCOVERY_DATA` at any JSON file
with the same record shape.

For allow/deny policies (e.g. excluding servers your org hasn't
vetted), pass `exclude_servers` — see [`SECURITY.md`](./SECURITY.md).

## Development

```bash
npm run typecheck   # tsc --noEmit
npm run test:run    # vitest (includes an end-to-end local-mode discover)
npm run build       # compile to dist/
```

CI runs all three on every push and PR.

## License

MIT
