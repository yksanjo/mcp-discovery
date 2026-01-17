# MCP Discovery API - Pitch

## One-Liner
**The discovery API that AI agents use to find the right MCP server for any task.**

---

## The Problem

AI agents are limited to pre-configured tools. They can't:
- Discover new MCP servers dynamically
- Compare performance across servers
- Adapt tool selection based on real-time conditions

**Manual discovery is broken.** Mintlify's mcpt registry shut down after 5 days. Smithery only offers discovery, no performance data.

---

## The Solution

**MCP Discovery API** - Agent-native infrastructure for MCP server discovery.

```
Agent: "I need a database with authentication"
     ↓
MCP Discovery API
     ↓
Returns: Supabase MCP Server (94% confidence)
         - Install: npx -y @supabase/mcp-server
         - Latency: 120ms
         - Uptime: 99.9%
```

---

## How It Works

### For AI Agents
```bash
# Install once, discover forever
npx @mcp-tools/discovery
```

### Three Powerful Tools

1. **discover_mcp_server** - Semantic search for MCP servers
   ```json
   { "need": "send emails with templates" }
   → Returns ranked recommendations with install commands
   ```

2. **get_server_metrics** - Real-time performance data
   ```json
   { "server_id": "gmail-server", "time_range": "24h" }
   → Returns latency, uptime, success rates
   ```

3. **compare_servers** - Side-by-side comparison
   ```json
   { "server_ids": ["postgres-server", "mongodb-server"] }
   → Returns rankings by latency, uptime, features
   ```

---

## Why This Matters

### The New Distribution Funnel

```
Old: Human finds tool → Configures for agent → Agent uses

New: Agent query → MCP Discovery → Auto-install → Agent uses
```

**Agents don't have loyalty.** They'll recommend the tool with:
- Better documentation
- Lower latency
- Higher uptime
- Cleaner API

---

## Technical Stack

- **API**: Node.js + TypeScript
- **Database**: Supabase (PostgreSQL + pgvector)
- **Search**: OpenAI embeddings for semantic matching
- **Protocol**: MCP-native (works with Claude, Cursor, Windsurf)

---

## Current Status

✅ **24 MCP servers indexed**
- Database: PostgreSQL, SQLite, MongoDB, Redis
- Communication: Slack, Gmail, Linear, Notion
- Automation: Puppeteer, Playwright
- Development: Git, GitHub, GitLab
- Search: Brave Search, Exa

✅ **91 capabilities tagged**
- Semantic search across all capabilities
- Performance metrics tracking
- Real-time availability monitoring

✅ **Live API**
- Health: https://mcp-discovery-production.up.railway.app/health
- Discovery: POST /api/v1/discover

---

## Roadmap

### Week 1-2 (Current)
- [x] Core MCP server with 3 tools
- [x] Supabase integration with pgvector
- [x] 24 servers seeded
- [x] Railway deployment

### Week 3-4
- [ ] Publish to npm as @mcp-tools/discovery
- [ ] GitHub MCP Registry submission
- [ ] Anthropic partnership outreach

### Month 2
- [ ] 100+ MCP servers indexed
- [ ] Automated scraping from GitHub/Smithery
- [ ] Server owner self-registration portal

### Month 3
- [ ] Performance monitoring dashboard
- [ ] Paid tier for API access
- [ ] Enterprise deployment options

---

## Call to Action

### For AI Agent Developers
Install the MCP Discovery server and let your agents find the best tools automatically.

### For MCP Server Creators
Get your server indexed for free. Better visibility = more usage.

### For Enterprises
Contact us for private deployment and custom integrations.

---

## Links

- **API**: https://mcp-discovery-production.up.railway.app
- **GitHub**: https://github.com/yksanjo/mcp-discovery
- **MCP Protocol**: https://modelcontextprotocol.io

---

## Contact

**Built by Yoshi**
- GitHub: @yksanjo
- Project: MCP Discovery API

*The infrastructure layer for the agentic web.*
