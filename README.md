# MCP Discovery API

Agent-native discovery and routing layer for Model Context Protocol (MCP) servers. Enables AI agents to autonomously discover, evaluate, and select the best MCP servers for their tasks.

## Features

- **Semantic Search**: Find MCP servers using natural language queries
- **Performance Metrics**: Get real-time latency, uptime, and reliability data
- **Server Comparison**: Compare multiple MCP servers side-by-side
- **Agent-Native**: Works seamlessly with Claude, Cursor, and other MCP clients

## Installation

### Using npx (Recommended)

```bash
npx @mcp-tools/discovery
```

### Manual Installation

```bash
npm install -g @mcp-tools/discovery
mcp-discovery
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "discovery": {
      "command": "npx",
      "args": ["-y", "@mcp-tools/discovery"],
      "env": {
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "OPENAI_API_KEY": "your-openai-api-key"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "discovery": {
      "command": "npx",
      "args": ["-y", "@mcp-tools/discovery"],
      "env": {
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "OPENAI_API_KEY": "your-openai-api-key"
      }
    }
  }
}
```

## Tools

### discover_mcp_server

Find MCP servers matching a natural language requirement.

**Input:**
```json
{
  "need": "database with authentication",
  "constraints": {
    "max_latency_ms": 200,
    "required_features": ["auth", "realtime"],
    "exclude_servers": ["deprecated-server"]
  },
  "limit": 5
}
```

**Output:**
```json
{
  "recommendations": [
    {
      "server": "supabase-mcp-server",
      "npm_package": "@supabase/mcp-server",
      "install_command": "npx -y @supabase/mcp-server",
      "confidence": 0.94,
      "description": "Open source Firebase alternative...",
      "capabilities": ["postgres", "auth", "storage", "realtime"],
      "metrics": {
        "avg_latency_ms": 120,
        "uptime_pct": 99.9,
        "last_checked": "2026-01-17T10:30:00Z"
      },
      "docs_url": "https://supabase.com/docs",
      "github_url": "https://github.com/supabase/mcp-server"
    }
  ],
  "total_found": 1,
  "query_time_ms": 245
}
```

### get_server_metrics

Get detailed performance metrics for a specific MCP server.

**Input:**
```json
{
  "server_id": "postgres-server",
  "time_range": "24h"
}
```

**Output:**
```json
{
  "server": {
    "id": "uuid",
    "name": "PostgreSQL Server",
    "slug": "postgres-server"
  },
  "metrics": {
    "current": {
      "latency_ms": 85,
      "success_rate": 0.99,
      "uptime_pct": 99.95,
      "active_connections": 42
    },
    "history": [
      {
        "timestamp": "2026-01-16T10:00:00Z",
        "latency_ms": 82,
        "success_rate": 1.0,
        "uptime_pct": 100
      }
    ]
  }
}
```

### compare_servers

Compare multiple MCP servers side-by-side.

**Input:**
```json
{
  "server_ids": ["postgres-server", "sqlite-server", "mongodb-server"],
  "compare_by": ["latency", "uptime", "features"]
}
```

**Output:**
```json
{
  "servers": [
    {
      "id": "uuid",
      "name": "PostgreSQL Server",
      "slug": "postgres-server",
      "capabilities": ["postgres", "sql", "database"],
      "metrics": {
        "latency_ms": 85,
        "uptime_pct": 99.95,
        "success_rate": 0.99
      },
      "ranking": {
        "by_latency": 1,
        "by_uptime": 1,
        "by_features": 2
      }
    }
  ]
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `OPENAI_API_KEY` | OpenAI API key for embeddings | Yes |
| `LOG_LEVEL` | Log level (debug, info, warn, error) | No |

## Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Enable the pgvector extension in the SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. Run the schema from `src/db/schema.sql` in the SQL editor

4. Seed the initial data:
   ```bash
   npm run seed
   npm run generate-embeddings
   ```

## Development

### Setup

```bash
git clone https://github.com/yksanjo/mcp-discovery.git
cd mcp-discovery
npm install
cp .env.example .env
# Edit .env with your credentials
```

### Build

```bash
npm run build
```

### Run Locally

```bash
npm run dev
```

### Test

```bash
npm test
```

### Seed Data

```bash
npm run seed
npm run generate-embeddings
```

## Deployment

### Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add environment variables
4. Deploy

### Docker

```bash
docker build -t mcp-discovery .
docker run -e SUPABASE_URL=... -e SUPABASE_SERVICE_ROLE_KEY=... -e OPENAI_API_KEY=... mcp-discovery
```

## Example Usage

```
User: "I need to store user profiles with authentication"

Claude calls: discover_mcp_server({ need: "store user profiles with authentication" })

Returns: Supabase MCP server with 0.94 confidence

Claude: "I recommend the Supabase MCP server. It provides PostgreSQL database
with built-in authentication, real-time subscriptions, and row-level security.

To install: npx -y @supabase/mcp-server"
```

## Architecture

```
┌─────────────────────────────────────┐
│   AI Agent (Claude, Cursor, etc)   │
│   Working on user task              │
└────────────┬────────────────────────┘
             │
             │ Calls: discover_mcp_server(need)
             ↓
┌─────────────────────────────────────┐
│   MCP DISCOVERY SERVER              │
│   @mcp-tools/discovery              │
│   - Semantic capability matching    │
│   - Performance ranking             │
│   - Returns structured metadata     │
└────────────┬────────────────────────┘
             │
             │ Queries database
             ↓
┌─────────────────────────────────────┐
│   SUPABASE (PostgreSQL + pgvector) │
│   - MCP servers registry            │
│   - Capabilities index              │
│   - Performance metrics             │
│   - Embeddings for search           │
└─────────────────────────────────────┘
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [Supabase](https://supabase.com)
