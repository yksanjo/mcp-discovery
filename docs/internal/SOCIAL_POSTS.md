# Social Media Posts for MCP Discovery API

## Twitter/X Posts

### Launch Announcement
```
🚀 Just launched: MCP Discovery API

The discovery layer that AI agents use to find the right MCP server for any task.

"I need a database with auth"
→ Returns Supabase MCP (94% confidence) + install command

24 servers indexed. Live now.

API: mcp-discovery-production.up.railway.app
GitHub: github.com/yksanjo/mcp-discovery

#MCP #AI #Agents
```

### Technical Thread
```
Thread: Why I built MCP Discovery API 🧵

1/ AI agents are limited to pre-configured tools. They can't discover new capabilities dynamically.

2/ Mintlify's mcpt registry shut down after 5 days. Smithery only does discovery, no performance data.

3/ So I built the missing infrastructure: semantic search + metrics for MCP servers.

4/ How it works:
Agent: "I need to send emails"
API: Returns Gmail MCP server + latency + uptime + install command

5/ Three tools:
- discover_mcp_server (semantic search)
- get_server_metrics (performance data)
- compare_servers (side-by-side)

6/ Tech stack:
- Supabase + pgvector for semantic search
- OpenAI embeddings
- Railway deployment
- MCP-native protocol

7/ Currently indexed: 24 servers, 91 capabilities

Live: mcp-discovery-production.up.railway.app

GitHub: github.com/yksanjo/mcp-discovery
```

### Short Hook Posts
```
Agents don't have loyalty.

They'll recommend the tool with better docs, lower latency, and higher uptime.

MCP Discovery API: Let agents find the best MCP server for any task.

github.com/yksanjo/mcp-discovery
```

```
What if Claude could discover new tools on its own?

MCP Discovery API makes it possible.

Semantic search across 24 MCP servers.
Performance metrics in real-time.
One-click installation commands.

Open source: github.com/yksanjo/mcp-discovery
```

---

## Reddit Posts

### r/ClaudeAI
```
Title: I built an MCP Discovery API - lets Claude find the best MCP server for any task

Hey everyone,

I built MCP Discovery API - a discovery layer that enables AI agents to autonomously find and select MCP servers.

**The Problem:**
- Agents are limited to pre-configured MCP servers
- No way to compare performance or reliability
- Manual discovery is slow and broken

**The Solution:**
- Semantic search: "I need a database with auth" → Returns best matches
- Performance metrics: latency, uptime, success rates
- One-click install commands

**Currently indexed:**
- 24 MCP servers (PostgreSQL, Slack, GitHub, Puppeteer, etc.)
- 91 capabilities tagged for semantic matching

**Links:**
- Live API: https://mcp-discovery-production.up.railway.app
- GitHub: https://github.com/yksanjo/mcp-discovery

Would love feedback from the community!
```

### r/LocalLLaMA
```
Title: MCP Discovery API - Infrastructure for agent tool discovery

Built an open-source discovery layer for MCP (Model Context Protocol) servers.

Agents can query natural language needs and get back:
- Ranked server recommendations
- Install commands
- Performance metrics (latency, uptime)

Uses Supabase + pgvector for semantic search.

24 servers indexed so far. Looking to expand.

GitHub: https://github.com/yksanjo/mcp-discovery
```

---

## Hacker News

```
Title: Show HN: MCP Discovery API – Let AI agents find the right tools automatically

Hi HN,

I built MCP Discovery API, an agent-native discovery layer for Model Context Protocol servers.

The problem: AI agents can only use tools you pre-configure. They can't discover new capabilities dynamically.

The solution: A semantic search API that returns the best MCP server for any task.

Example:
Query: "I need to send emails with templates"
Response: Gmail MCP server (87% confidence) + install: npx -y @anthropic/mcp-server-gmail

Features:
- Semantic search using OpenAI embeddings + pgvector
- Real-time performance metrics (latency, uptime)
- Side-by-side server comparison
- 24 servers indexed, 91 capabilities tagged

Tech: TypeScript, Supabase, Railway, MCP SDK

Live: https://mcp-discovery-production.up.railway.app
GitHub: https://github.com/yksanjo/mcp-discovery

Feedback welcome!
```

---

## LinkedIn

```
🚀 Excited to announce MCP Discovery API

The infrastructure layer that enables AI agents to discover the right tools automatically.

The Problem:
AI agents are limited to pre-configured tools. There's no way for them to dynamically find new capabilities based on the task at hand.

The Solution:
MCP Discovery API provides semantic search across MCP servers, letting agents find the best tool for any need - with performance metrics and one-click installation.

How it works:
• Agent needs: "database with authentication"
• API returns: Supabase MCP (94% match) + install command + uptime: 99.9%

Currently indexed:
• 24 MCP servers (databases, communication, automation)
• 91 capabilities for semantic matching

This is the beginning of truly autonomous agents that can adapt their toolset on the fly.

🔗 Live API: https://mcp-discovery-production.up.railway.app
🔗 GitHub: https://github.com/yksanjo/mcp-discovery

#AI #Agents #MCP #Infrastructure #OpenSource
```

---

## Product Hunt (for later)

```
Tagline: The discovery API that AI agents use to find the right MCP server

Description:
MCP Discovery API enables AI agents to autonomously discover, evaluate, and select the best MCP (Model Context Protocol) servers for their tasks.

Features:
✅ Semantic search - Find servers using natural language
✅ Performance metrics - Real-time latency and uptime data
✅ Server comparison - Side-by-side analysis
✅ 24 servers indexed - Databases, communication, automation
✅ Open source - MIT licensed

Use cases:
• Let Claude find the best database tool for your project
• Compare MCP servers before installation
• Monitor tool performance across your agent fleet

Links:
• Website: https://mcp-discovery-production.up.railway.app
• GitHub: https://github.com/yksanjo/mcp-discovery
```
