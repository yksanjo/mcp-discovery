# Changelog

All notable changes to MCP Discovery will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
