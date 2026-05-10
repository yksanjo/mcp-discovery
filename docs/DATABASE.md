# MCP Discovery Database

## Overview

This database contains **5,468 unique MCP servers** collected from all major sources in the MCP ecosystem.

## Statistics

### Total Servers: 5,468

### By Source
| Source | Count | Percentage |
|--------|-------|------------|
| Glama.ai | 3,576 | 65.4% |
| Awesome Lists | 1,293 | 23.6% |
| NPM Registry | 598 | 10.9% |
| Official Registry | 1 | 0.01% |

### By Category
| Category | Count |
|----------|-------|
| Other | ~4,000+ |
| Database | ~400 |
| Development | ~350 |
| AI/ML | ~200 |
| Communication | ~150 |
| Cloud | ~100 |
| Automation | ~100 |
| Security | ~50 |

## Data Files

### `/data/mcp_servers_complete.json`
Complete JSON database with all server details including:
- Name and slug
- Description
- NPM package name
- GitHub URL
- Install command
- Category
- Source
- Author
- Stars/downloads

### `/data/mcp_servers_complete.csv`
CSV format for easy import into spreadsheets and databases.

### `/data/MCP_SERVERS_COMPLETE.md`
Human-readable markdown documentation with top servers.

### `/data/summary.json`
JSON summary with statistics.

## Top Servers by Popularity

Based on GitHub stars and NPM downloads:

1. **@modelcontextprotocol/server-filesystem** - File system access
2. **@modelcontextprotocol/server-postgres** - PostgreSQL database
3. **@modelcontextprotocol/server-sqlite** - SQLite database
4. **@modelcontextprotocol/server-github** - GitHub integration
5. **@modelcontextprotocol/server-git** - Git operations

## Installation Commands

Most servers can be installed with:
```bash
npx -y @namespace/server-name
```

## API Usage

Query the live API:
```bash
curl -X POST https://mcp-discovery-two.vercel.app/api/v1/discover \
  -H "Content-Type: application/json" \
  -d '{"need": "database access"}'
```

## Last Updated

2026-02-09

## License

MIT - See main repository for details
