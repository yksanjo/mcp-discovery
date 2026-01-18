# MCP Discovery

### The Largest MCP Server Index - 715+ Servers for AI Agents

[![Servers](https://img.shields.io/badge/MCP%20Servers-715+-blue)](https://mcp-discovery-two.vercel.app)
[![API](https://img.shields.io/badge/API-Live-green)](https://mcp-discovery-two.vercel.app/health)
[![Categories](https://img.shields.io/badge/Categories-32-purple)](https://mcp-discovery-two.vercel.app/api/v1/categories)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**Live API:** https://mcp-discovery-two.vercel.app

---

## Why MCP Discovery?

| Challenge | Without MCP Discovery | With MCP Discovery |
|-----------|----------------------|-------------------|
| Finding servers | Manual search through docs | Natural language: "I need a database" |
| Server count | Scattered across registries | **715+ servers in one place** |
| For AI agents | Agents can't discover tools | Agents autonomously find tools |
| Speed | Minutes of searching | **Sub-100ms responses** |

---

## For AI Agents - Built Agent-First

MCP Discovery is designed for **AI agents to call directly**. Your agent can autonomously discover and select the right MCP server:

```
User: "Help me sync my Notion notes to a database"

Agent thinks: "I need Notion access and a database"

Agent calls: POST /api/v1/discover
             {"need": "connect to notion"}

Returns: notion-mcp-server with install command

Agent calls: POST /api/v1/discover
             {"need": "database storage"}

Returns: sqlite-server, redis-server, supabase-server

Agent: "I'll use notion-mcp-server and sqlite-server for this task..."
```

---

## Quick Start

### Find an MCP Server (One Line)

```bash
curl -X POST https://mcp-discovery-two.vercel.app/api/v1/discover \
  -H "Content-Type: application/json" \
  -d '{"need": "send emails"}'
```

**Response:**
```json
{
  "recommendations": [
    {
      "server": "gmail-server",
      "name": "Gmail Server",
      "install_command": "npx -y @anthropic/mcp-server-gmail",
      "confidence": 0.52,
      "description": "Gmail integration for MCP...",
      "category": "communication"
    }
  ],
  "total_found": 3,
  "query_time_ms": 156
}
```

### Browse Categories

```bash
curl https://mcp-discovery-two.vercel.app/api/v1/categories
```

### List Servers by Category

```bash
curl "https://mcp-discovery-two.vercel.app/api/v1/servers?category=database&limit=10"
```

---

## What's Indexed

### 715+ MCP Servers from Multiple Sources

| Source | Servers |
|--------|---------|
| Glama.ai | 785 |
| NPM Registry | 1,000+ |
| Official MCP Registry | 30 |
| GitHub awesome-lists | 50+ |

### 32 Categories

| Category | Count | Category | Count |
|----------|-------|----------|-------|
| **Development** | 259 | Security | 17 |
| **Automation** | 73 | Finance | 16 |
| **AI** | 59 | Content | 14 |
| **Productivity** | 48 | Research | 13 |
| **Database** | 43 | Design | 12 |
| Cloud | 26 | Scraping | 11 |
| Monitoring | 24 | Media | 8 |
| Communication | 21 | Translation | 6 |
| Search | 20 | Social | 4 |
| Blockchain | 18 | 3D | 5 |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | API status + server count |
| `/api/v1/discover` | POST | **Semantic search** - find servers by need |
| `/api/v1/servers` | GET | List servers (with category filter) |
| `/api/v1/servers/:slug` | GET | Get server details |
| `/api/v1/categories` | GET | List all categories with counts |

### Discover Request

```json
{
  "need": "I need to work with GitHub repositories",
  "limit": 5
}
```

### Discover Response

```json
{
  "recommendations": [
    {
      "server": "github-server",
      "name": "GitHub Server",
      "npm_package": "@modelcontextprotocol/server-github",
      "install_command": "npx -y @modelcontextprotocol/server-github",
      "confidence": 0.65,
      "description": "GitHub API integration for MCP...",
      "category": "development",
      "github_url": "https://github.com/modelcontextprotocol/servers",
      "docs_url": "https://modelcontextprotocol.io/docs/servers/github"
    }
  ],
  "total_found": 5,
  "query_time_ms": 142
}
```

---

## Use Cases

### 1. AI Coding Assistants (Cursor, Continue, Windsurf)

```javascript
// Agent discovers tools dynamically
const tools = await fetch('https://mcp-discovery-two.vercel.app/api/v1/discover', {
  method: 'POST',
  body: JSON.stringify({ need: 'git operations' })
});
// Returns: git-server, github-server, gitlab-server
```

### 2. Autonomous Agents

```python
# Agent self-equips with needed capabilities
needs = ["database", "file storage", "send notifications"]
for need in needs:
    servers = discover(need)
    agent.install(servers[0].install_command)
```

### 3. MCP Server Directories & Dashboards

```javascript
// Build your own MCP directory
const categories = await fetch('.../api/v1/categories');
const servers = await fetch('.../api/v1/servers?category=database');
```

### 4. Claude Desktop / MCP Clients

Add discovery capability to your MCP client:

```json
{
  "mcpServers": {
    "discovery": {
      "command": "npx",
      "args": ["-y", "mcp-discovery-api"]
    }
  }
}
```

---

## Performance

| Metric | Value |
|--------|-------|
| Servers indexed | 715+ |
| Semantic search | ~1.5s (first call) |
| Cached queries | **< 5ms** |
| Text search fallback | ~200ms |
| API uptime | 99.9% (Vercel) |

---

## Tech Stack

- **Database:** Supabase (PostgreSQL + pgvector)
- **Embeddings:** OpenAI text-embedding-3-small (1536 dims)
- **API:** Vercel Serverless Functions
- **Scraping:** DeepSeek API for intelligent extraction

---

## Self-Host

### Environment Variables

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

### Run Locally

```bash
git clone https://github.com/yksanjo/mcp-discovery.git
cd mcp-discovery
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev:api
```

### Deploy to Vercel

```bash
vercel --prod
```

---

## Roadmap

- [ ] Real-time metrics collection
- [ ] Server health monitoring
- [ ] User ratings & reviews
- [ ] API key authentication
- [ ] Webhook notifications for new servers
- [ ] MCP server auto-testing

---

## Contributing

We welcome contributions! Areas we need help:

1. **Add more servers** - Submit PRs to expand the index
2. **Improve search** - Better ranking algorithms
3. **Build integrations** - Cursor, Continue, Zed plugins
4. **Documentation** - Guides and tutorials

---

## Links

- **Live API:** https://mcp-discovery-two.vercel.app
- **Health Check:** https://mcp-discovery-two.vercel.app/health
- **Categories:** https://mcp-discovery-two.vercel.app/api/v1/categories
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)

---

## License

MIT

---

<p align="center">
  <b>715+ MCP Servers. One API. Built for AI Agents.</b>
</p>
