# Changelog

All notable changes to MCP Discovery will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-04-30

### Added
- **`force_refresh` parameter** on `POST /api/v1/discover` — bypass the
  server-side cache and fetch live results without restarting the
  session. Surfaced in both the API and the LangChain `MCPDiscoveryTool`.
- **Verification signals in API responses**: `is_verified` (boolean) and
  `trust_score` (0–100) now exposed on every server result so callers
  can prefer trusted entries for unattended/agent-driven installs.
- **True async in the LangChain tool**: `_arun` now uses `aiohttp`
  natively instead of wrapping the sync path. Concurrent agents no
  longer block on each other.
- **Global Chat MCP Server** indexed in seed data (cross-protocol agent
  discovery, 100k+ agents across 15+ registries). Adds `agent-discovery`,
  `a2a`, `agents-txt`, `directory`, and `mcp` capabilities. (#3)
- **`SECURITY.md`** rewritten with a real threat model (metadata-only,
  no execution), data-source pipeline, and `exclude_servers` filter
  documentation for callers needing allow/deny policies. (#1)

### Changed
- LangChain integration README updated to reflect `force_refresh` and
  verified-badge display in formatted results.

## [1.1.0] - 2026-02-02

### Added
- **AutoGPT Integration**: Native workflow blocks for AutoGPT platform
  - `MCPDiscoveryBlock` - Semantic search for MCP servers
  - `MCPDiscoveryCategoriesBlock` - Browse available categories
  - Optional integration with graceful error handling
  - PR submitted: [AutoGPT Issue #11793](https://github.com/Significant-Gravitas/AutoGPT/issues/11793)
- AutoGPT badge to README
- Citation section in README with BibTeX format
- Keywords in package.json: `langchain`, `autogpt`, `tool-discovery`

### Changed
- Updated package.json description to mention AutoGPT integration
- Updated LangChain README with date and AutoGPT reference

## [1.0.0] - 2026-01-30

### Added
- Initial release of MCP Discovery API
- 14,000+ MCP servers indexed
- Semantic search endpoint (`/api/v1/discover`)
- Categories endpoint (`/api/v1/categories`)
- Server details endpoint (`/api/v1/servers/:slug`)
- LangChain integration with `MCPDiscoveryTool`
- npm package: `mcp-discovery-api`
- Support for Glama.ai, NPM Registry, and GitHub sources

### Features
- Semantic search using OpenAI embeddings
- Performance metrics (latency, uptime)
- Installation commands
- Category-based browsing
- RESTful API with JSON responses
- TypeScript support

---

## Citation

If you use MCP Discovery in your research or project, please cite:

```bibtex
@software{mcp_discovery,
  title = {MCP Discovery: Dynamic Tool Discovery for AI Agents},
  author = {yksanjo},
  year = {2026},
  url = {https://github.com/yksanjo/mcp-discovery},
  note = {Last updated: February 2, 2026}
}
```

### Related Work

- **AutoGPT Integration** (Feb 2026): [GitHub Issue #11793](https://github.com/Significant-Gravitas/AutoGPT/issues/11793) - Dynamic tool discovery integration proposal for autonomous agents
