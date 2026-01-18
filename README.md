# MCP Discovery

### The World's Largest MCP Server Index - 14,000+ Servers

[![Servers](https://img.shields.io/badge/MCP%20Servers-14,000+-blue)](https://mcp-discovery-two.vercel.app)
[![API](https://img.shields.io/badge/API-Live-green)](https://mcp-discovery-two.vercel.app/health)
[![Built For](https://img.shields.io/badge/Built%20For-AI%20Agents-purple)](https://mcp-discovery-two.vercel.app/api/v1/discover)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**Live API:** https://mcp-discovery-two.vercel.app

---

## Not for Humans. Built for Agents.

MCP Discovery is **NOT a website for humans to browse**. It's a machine-to-machine API designed for AI agents to programmatically discover tools.

With **14,000+ MCP servers indexed**, no human could reasonably browse this directory. But an AI agent can query it in milliseconds and find exactly what it needs.

```
Human: "Help me analyze my GitHub repos and save to a database"

Agent thinks: "I need GitHub access and database storage"

Agent calls: POST /api/v1/discover {"need": "github api access"}
Agent calls: POST /api/v1/discover {"need": "database storage"}

Agent receives: github-server, sqlite-server, postgres-server
Agent installs tools and completes the task autonomously
```

**The agent never asks the human which MCP server to use. It just figures it out.**

---

## Why 14,000+ Servers Matters

| Without MCP Discovery | With MCP Discovery |
|----------------------|-------------------|
| Agent asks human: "Which MCP server should I use?" | Agent discovers tools autonomously |
| Human searches docs for 10 minutes | Agent queries API in 50ms |
| Limited to servers human knows about | Access to **14,000+ servers** |
| Manual tool selection | Semantic search: "I need X" |

**Scale matters.** The more servers indexed, the more capable your agent becomes.

---

## Quick Start (For Agent Developers)

### Semantic Search - Find Any Tool

```bash
curl -X POST https://mcp-discovery-two.vercel.app/api/v1/discover \
  -H "Content-Type: application/json" \
  -d '{"need": "send slack notifications"}'
```

**Response:**
```json
{
  "recommendations": [
    {
      "server": "slack-server",
      "name": "Slack MCP Server",
      "install_command": "npx -y @anthropic/mcp-server-slack",
      "confidence": 0.72,
      "description": "Slack integration for MCP...",
      "category": "communication"
    }
  ],
  "total_found": 5,
  "query_time_ms": 48
}
```

### List All Categories

```bash
curl https://mcp-discovery-two.vercel.app/api/v1/categories
```

### Browse by Category

```bash
curl "https://mcp-discovery-two.vercel.app/api/v1/servers?category=database&limit=50"
```

---

## Index Statistics

### 14,000+ MCP Servers from All Major Sources

| Source | Servers Indexed |
|--------|-----------------|
| **Glama.ai** | 13,273 |
| NPM Registry | 500+ |
| Official MCP Registry | 50+ |
| GitHub Repositories | 200+ |

### Categories (21+)

| Category | Count | Category | Count |
|----------|-------|----------|-------|
| **Other/Misc** | 10,000+ | Communication | 500+ |
| **Development** | 1,500+ | Blockchain | 300+ |
| **Automation** | 800+ | Finance | 200+ |
| **AI/ML** | 700+ | Design | 150+ |
| **Database** | 600+ | Media | 100+ |
| **Cloud** | 400+ | 3D | 50+ |

*Categories are auto-assigned. "Other" contains specialized tools.*

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | API status + total server count |
| `/api/v1/discover` | POST | **Semantic search** - natural language queries |
| `/api/v1/servers` | GET | List servers (paginated, filterable) |
| `/api/v1/servers/:slug` | GET | Get specific server details |
| `/api/v1/categories` | GET | List all categories with counts |

### POST /api/v1/discover

The primary endpoint for agents. Accepts natural language queries.

**Request:**
```json
{
  "need": "I need to read and write files on the local filesystem",
  "limit": 10
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "server": "filesystem-server",
      "name": "Filesystem Server",
      "npm_package": "@modelcontextprotocol/server-filesystem",
      "install_command": "npx -y @modelcontextprotocol/server-filesystem",
      "confidence": 0.85,
      "description": "Secure file operations for MCP...",
      "category": "development",
      "github_url": "https://github.com/modelcontextprotocol/servers"
    }
  ],
  "total_found": 10,
  "query_time_ms": 52
}
```

---

## Integration Examples

### Autonomous Agent (Python)

```python
import requests

class AutonomousAgent:
    def discover_tools(self, task_description: str) -> list:
        """Agent discovers needed tools without human intervention"""
        response = requests.post(
            "https://mcp-discovery-two.vercel.app/api/v1/discover",
            json={"need": task_description, "limit": 5}
        )
        return response.json()["recommendations"]

    def execute_task(self, user_request: str):
        # Agent analyzes request and discovers tools
        tools = self.discover_tools(user_request)

        # Agent installs first recommended tool
        install_cmd = tools[0]["install_command"]
        # ... agent proceeds autonomously
```

### AI Coding Assistant (JavaScript)

```javascript
// Agent middleware for Cursor/Continue/Windsurf
async function discoverMCPServer(need) {
  const response = await fetch('https://mcp-discovery-two.vercel.app/api/v1/discover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ need, limit: 3 })
  });
  return response.json();
}

// Usage in agent loop
const tools = await discoverMCPServer('database for storing user preferences');
// Returns: sqlite-server, redis-server, postgres-server
```

### Claude Desktop Integration

Add discovery as an MCP server itself:

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
| **Servers indexed** | 14,000+ |
| **Semantic search** | ~50-200ms |
| **Cached queries** | < 5ms |
| **API uptime** | 99.9% (Vercel Edge) |
| **Index freshness** | Updated daily |

---

## Tech Stack

- **Database:** Supabase (PostgreSQL + pgvector for semantic search)
- **Embeddings:** OpenAI text-embedding-3-small (1536 dimensions)
- **API:** Vercel Serverless Functions (Edge-optimized)
- **Scraping:** Direct API integration + DeepSeek for extraction

---

## Self-Host

### Environment Variables

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

### Deploy

```bash
git clone https://github.com/yksanjo/mcp-discovery.git
cd mcp-discovery
npm install
cp .env.example .env
# Configure your credentials
vercel --prod
```

---

## The Vision

As AI agents become more autonomous, they need to discover their own tools. MCP Discovery is the infrastructure layer that enables this.

**Today:** 14,000+ servers indexed
**Goal:** Every MCP server ever created, instantly discoverable

---

## Links

- **Live API:** https://mcp-discovery-two.vercel.app
- **Health Check:** https://mcp-discovery-two.vercel.app/health
- **Categories:** https://mcp-discovery-two.vercel.app/api/v1/categories
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Anthropic MCP Servers](https://github.com/modelcontextprotocol/servers)

---

## License

MIT

---

<p align="center">
  <b>14,000+ MCP Servers. One API. Built for Machines.</b>
</p>
