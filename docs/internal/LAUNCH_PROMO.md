# MCP Discovery - Launch Promotion

## Live API
**Production URL:** https://mcp-discovery-two.vercel.app

---

## X/Twitter Posts

### Main Launch Post
```
Just launched MCP Discovery - the first AI-powered search engine for MCP servers

715+ servers indexed from:
- Glama.ai
- NPM Registry
- Official MCP Registry

AI agents can now find the right tools in milliseconds

Try it: https://mcp-discovery-two.vercel.app

#MCP #AI #Anthropic #Claude
```

### Technical Post
```
Built an MCP server discovery API in a weekend:

- Scraped 1,800+ servers using DeepSeek
- Semantic search with OpenAI embeddings
- Sub-100ms cached queries
- Supabase + Vercel stack

Open for agents to use:
POST /api/v1/discover
{"need": "connect to notion"}

https://mcp-discovery-two.vercel.app
```

### Developer Post
```
Problem: Finding the right MCP server is hard

Solution: Natural language search

"I need a database" → sqlite-server, redis-server, memory-server

"Send emails" → gmail-server, mailpace-server

715 servers, instant results

API: https://mcp-discovery-two.vercel.app/api/v1/discover
```

### Stats Post
```
MCP Discovery stats after launch:

Servers indexed: 715
Categories: 32
Sources: Glama, NPM, Official Registry

Top categories:
- Development: 259
- Automation: 73
- AI: 59
- Productivity: 48
- Database: 43

Free API: https://mcp-discovery-two.vercel.app
```

---

## API Examples for Promotion

### Health Check
```bash
curl https://mcp-discovery-two.vercel.app/health
# {"status":"ok","service":"mcp-discovery","version":"1.0.0","servers_count":715}
```

### Semantic Search
```bash
curl -X POST https://mcp-discovery-two.vercel.app/api/v1/discover \
  -H "Content-Type: application/json" \
  -d '{"need": "I need to connect to my Notion workspace"}'
```

### List by Category
```bash
curl "https://mcp-discovery-two.vercel.app/api/v1/servers?category=database&limit=5"
```

### Get Categories
```bash
curl https://mcp-discovery-two.vercel.app/api/v1/categories
```

---

## Product Hunt Copy

### Tagline
**MCP Discovery - Find the right MCP server for your AI agent**

### Description
```
MCP Discovery is the first search engine for Model Context Protocol (MCP) servers.

With 715+ indexed servers, AI agents can find the tools they need using natural language:
- "I need to connect to Notion" → notion-mcp-server
- "Database for storing data" → sqlite-server, redis-server
- "Send emails" → gmail-server, mailpace-server

Features:
- Semantic search powered by embeddings
- 32 categories from databases to blockchain
- Instant results with caching
- Free API for all agents

Built for the MCP ecosystem to help AI agents discover and use the right tools.
```

### Maker Comment
```
Hey Product Hunt!

I built MCP Discovery because finding the right MCP server was becoming a pain point. With 715+ servers now available, it's hard to know which one fits your needs.

The API uses semantic search - just describe what you need in plain English and it finds the best matches. Perfect for AI agents that need to dynamically discover tools.

Tech stack: Supabase, Vercel, OpenAI embeddings, DeepSeek for scraping

Would love your feedback!
```

---

## GitHub README Update

### Badges
```markdown
![Servers](https://img.shields.io/badge/MCP%20Servers-715+-blue)
![API](https://img.shields.io/badge/API-Live-green)
![License](https://img.shields.io/badge/License-MIT-yellow)
```

### Quick Start Section
```markdown
## Quick Start

### Find an MCP Server
```bash
curl -X POST https://mcp-discovery-two.vercel.app/api/v1/discover \
  -H "Content-Type: application/json" \
  -d '{"need": "database for my app"}'
```

### Response
```json
{
  "recommendations": [
    {
      "server": "sqlite-server",
      "name": "SQLite Server",
      "install_command": "npx -y @modelcontextprotocol/server-sqlite",
      "confidence": 0.47,
      "description": "SQLite database server for MCP..."
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

### List Servers
```bash
curl "https://mcp-discovery-two.vercel.app/api/v1/servers?category=automation&limit=10"
```
```

---

## LinkedIn Post

```
Excited to launch MCP Discovery - the first search engine for Model Context Protocol servers!

The Problem:
As the MCP ecosystem grows (now 715+ servers), finding the right tool for your AI agent is increasingly difficult.

The Solution:
A semantic search API that understands natural language queries like:
- "I need to connect to Notion"
- "Database for storing user data"
- "Send emails and notifications"

Tech Stack:
- Supabase for the database
- OpenAI for semantic embeddings
- Vercel for deployment
- DeepSeek for intelligent scraping

The API is free and ready for AI agents to use.

Check it out: https://mcp-discovery-two.vercel.app

#AI #MCP #Anthropic #Claude #APIs #DeveloperTools
```

---

## Hacker News Post

**Title:** MCP Discovery – Semantic search for 715+ MCP servers

**Text:**
```
I built a search engine for Model Context Protocol (MCP) servers.

MCP is Anthropic's open protocol that lets AI assistants connect to external tools. The ecosystem has grown to 700+ servers, making discovery a real problem.

MCP Discovery solves this with:
- Semantic search using embeddings
- Natural language queries ("I need a database" → sqlite-server)
- 32 categories from databases to blockchain
- Sub-100ms cached responses

API: https://mcp-discovery-two.vercel.app

Example:
POST /api/v1/discover
{"need": "connect to github"}

Returns ranked recommendations with install commands.

Built with Supabase, Vercel, and OpenAI embeddings. Scraped servers from Glama.ai, NPM, and the official registry using DeepSeek.

Would love feedback from the HN community!
```

---

## Discord/Slack Announcement

```
🚀 **MCP Discovery is Live!**

Find the right MCP server with natural language search.

**Stats:**
- 715+ servers indexed
- 32 categories
- Sub-100ms responses

**Try it:**
```
curl -X POST https://mcp-discovery-two.vercel.app/api/v1/discover \
  -H "Content-Type: application/json" \
  -d '{"need": "I need to work with git repositories"}'
```

**Endpoints:**
- `GET /health` - API status
- `POST /api/v1/discover` - Semantic search
- `GET /api/v1/servers` - List servers
- `GET /api/v1/categories` - Browse categories

Free to use! 🎉
```
