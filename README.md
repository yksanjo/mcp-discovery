# mcp-discovery

Agent-native discovery and routing layer for the Model Context Protocol
ecosystem. Indexes 14,000+ MCP servers across Glama.ai, NPM, and GitHub
and serves them through a semantic-search API, so AI agents can find
the right tool for a task at runtime instead of relying on a static,
hand-curated config file.

**Live API:** `https://mcp-discovery-two.vercel.app`

```bash
curl -X POST https://mcp-discovery-two.vercel.app/api/v1/discover \
  -H "Content-Type: application/json" \
  -d '{"query": "send messages to slack", "limit": 3}'
```

[![License](https://img.shields.io/github/license/yksanjo/mcp-discovery)](LICENSE)
![Servers indexed](https://img.shields.io/badge/servers-14%2C000%2B-blue)
![Status](https://img.shields.io/badge/status-beta-orange)

---

## Problem

The MCP ecosystem grew faster than agents can keep up with. Most agents
hard-code their MCP servers in a config file; adding a new server
requires a code change and a session restart. There's no way for an
agent to ask, *"What's available for sending Slack messages?"* and get
a ranked list of options it can install on demand.

`mcp-discovery` fixes that. Agents query in natural language, get back
ranked servers with install commands, latency metrics, and trust
signals, and can install on the fly.

## What it does

- **Semantic search** over 14,000+ servers (OpenAI embeddings, sub-100ms
  p50).
- **Trust signals** in every response: `is_verified` flag, `trust_score`
  (0–100), uptime %, average latency.
- **Native integrations** with [LangChain](./langchain/)
  (`MCPDiscoveryTool`) and AutoGPT (`MCPDiscoveryBlock`,
  `MCPDiscoveryCategoriesBlock`).
- **Filtering** via `exclude_servers` for allow/deny policies — see
  [SECURITY.md](./SECURITY.md).
- **`force_refresh`** to bypass cache when you need live data.

## Honest scope

- The index is a snapshot from scrapes of Glama.ai, NPM, and GitHub. It
  is refreshed periodically; for fast-moving servers, use
  `force_refresh=true`.
- `trust_score` is a heuristic composite of public signals (stars,
  publish recency, verified author, registry presence). It is not a
  security audit of the server's behavior.
- The live API is a free public endpoint with rate limits. For high-
  volume usage, self-host (see "Self-hosting" below).

## API

### Discover servers (semantic search)

```bash
POST /api/v1/discover
```

```json
{
  "query": "send messages to slack",
  "limit": 5,
  "min_trust_score": 60,
  "exclude_servers": ["sketchy-server-id"],
  "force_refresh": false
}
```

Response: ranked list of servers with `slug`, `name`, `description`,
`install_command`, `is_verified`, `trust_score`, `uptime_pct`,
`avg_latency_ms`.

### Browse by category

```bash
GET /api/v1/categories
GET /api/v1/categories/:slug
```

### Server detail

```bash
GET /api/v1/servers/:slug
```

## LangChain integration

```python
from mcp_discovery_tool import MCPDiscoveryTool

tool = MCPDiscoveryTool()
results = tool.run("send messages to slack")
```

See `langchain/SETUP_GUIDE.md` and `langchain/examples.ipynb`.

## Self-hosting

The full stack is TypeScript + Vercel + a Postgres-backed index.

```bash
git clone https://github.com/yksanjo/mcp-discovery.git
cd mcp-discovery
npm ci
npm run build
```

Required environment variables (see `.env.example`):

- `OPENAI_API_KEY` — for embedding generation.
- `DATABASE_URL` — Postgres connection string.

Scripts:

```bash
npm run dev:api            # local API server
npm run scrape             # re-scrape registries
npm run generate-embeddings
npm run seed               # seed local DB
npm test                   # vitest
```

## Architecture

```
.
├── api/                # Vercel serverless entry point
├── src/
│   ├── api.ts          # Express app (used by dev and serverless)
│   ├── server.ts       # MCP server interface
│   ├── services/       # Search, scoring, refresh
│   ├── db/             # Postgres schema + queries
│   ├── tools/          # MCP tool definitions
│   ├── types/          # Shared TS types
│   └── utils/          # Cache, embeddings client
├── langchain/          # Python integration package
├── scripts/            # Scrape, seed, embedding scripts
└── docs/
    └── internal/       # Launch notes, monetization, outreach drafts
```

## Security

See `SECURITY.md`. Reports of indexing-side issues (poisoned listings,
inflated trust scores) and API-side issues (auth, injection, DoS) are
welcome.

## Contributing

See `CONTRIBUTING.md`. Particularly useful contributions:

- Adding a new source registry (Glama, NPM, GitHub are wired today).
- Improving the `trust_score` heuristic.
- Tighter rate limiting / quotas for the free public endpoint.

## License

MIT. See `LICENSE`.

## Disclosures

Developed with assistance from AI coding tools.
