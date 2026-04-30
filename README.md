# mcp-discovery

Production-grade project scaffold focused on reliability, maintainability, and fast onboarding.

[![CI](https://img.shields.io/github/actions/workflow/status/yksanjo/mcp-discovery/ci.yml?branch=main&label=ci)](https://github.com/yksanjo/mcp-discovery/actions)
![License](https://img.shields.io/github/license/yksanjo/mcp-discovery)
![Last Commit](https://img.shields.io/github/last-commit/yksanjo/mcp-discovery)
![Repo Size](https://img.shields.io/github/repo-size/yksanjo/mcp-discovery)

## Overview

mcp-discovery is the agent-native discovery and routing layer for the
Model Context Protocol ecosystem. It indexes 14,000+ MCP servers across
Glama.ai, NPM, and GitHub and serves them through a semantic-search API
so AI agents can find the right tool for a task at runtime instead of
relying on a static, hand-curated config file.

**Live API:** `https://mcp-discovery-two.vercel.app`

## Problem

The MCP ecosystem grew faster than agents can keep up with. Most agents
hard-code their MCP servers in a config file; adding a new server
requires a code change and a session restart. There's no way for an
agent to ask, *"What's available for sending Slack messages?"* and get
a ranked list of options it can install on demand.

mcp-discovery fixes that. Agents query in natural language, get back
ranked servers with install commands, latency metrics, and trust
signals, and can install on the fly.

## Solution

- **Semantic search** over 14,000+ servers (OpenAI embeddings, sub-100ms p50).
- **Trust signals** in every response: `is_verified` flag, `trust_score`
  (0–100), uptime %, average latency.
- **Native integrations** with [LangChain](./langchain/) (`MCPDiscoveryTool`)
  and [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT/issues/11793)
  (`MCPDiscoveryBlock`, `MCPDiscoveryCategoriesBlock`).
- **Filtering** via `exclude_servers` for allow/deny policies — see
  [SECURITY.md](./SECURITY.md).
- **`force_refresh`** to bypass cache when you need live data.

## Key Features

- 14,000+ MCP servers indexed (Glama.ai, NPM, GitHub).
- `/api/v1/discover` — semantic search with optional filters.
- `/api/v1/categories` — browse by capability.
- `/api/v1/servers/:slug` — full server detail.
- LangChain `MCPDiscoveryTool` with true async (`aiohttp`).
- AutoGPT workflow blocks for the same.
- LRU cache with per-type TTLs (5m search / 1h embeddings / 10m server data).

## Repository Structure

```text
.
|-- src/                  # Core implementation
|-- tests/                # Automated test suites
|-- docs/                 # Design notes and operational docs
|-- .github/workflows/    # CI pipelines
|-- README.md
|-- LICENSE
|-- CONTRIBUTING.md
|-- SECURITY.md
|-- CODE_OF_CONDUCT.md
```

## Getting Started

### Prerequisites

- Git
- Project runtime/toolchain for this repo

### Local Setup

```bash
npm ci
npm run lint
npm test
npm run build
```

## Usage

Document primary commands, API routes, CLI examples, or UI workflows here.

## Quality Standards

- CI must pass before merge.
- Changes require tests for critical behavior.
- Security-sensitive changes should include risk notes.
- Keep pull requests focused and reviewable.

## Security

See `SECURITY.md` for responsible disclosure and handling guidelines.

## Contributing

See `CONTRIBUTING.md` for branching, commit, and pull request expectations.

## Roadmap

Track upcoming milestones, technical debt, and planned feature work.

## Support

Open a GitHub issue for bugs, feature requests, or documentation gaps.

## License

This project is released under the MIT License.
