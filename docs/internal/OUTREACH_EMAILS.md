# MCP Discovery - Outreach Email Templates

## 1. Email to Anthropic (Claude Team)

**To:** developer-relations@anthropic.com
**Subject:** MCP Discovery API - Discovery infrastructure for Claude agents

---

Hi Anthropic Team,

I built **MCP Discovery API** - an open-source discovery layer that helps Claude agents find the right MCP server for any task.

**The Problem:** Agents are limited to pre-configured MCP servers. There's no way to dynamically discover new capabilities.

**The Solution:** Semantic search across MCP servers with performance metrics.

```
User: "I need a database with authentication"
Claude calls: discover_mcp_server({ need: "database with auth" })
Returns: Supabase MCP (94% match) + install command + uptime data
```

**What's Live:**
- 24 MCP servers indexed with embeddings
- Semantic search via OpenAI + pgvector
- Performance metrics tracking
- Free tier (100 queries/mo) for all users

**Links:**
- API: https://mcp-discovery-production.up.railway.app
- GitHub: https://github.com/yksanjo/mcp-discovery

Would love to discuss how this could be integrated into Claude Desktop or the MCP ecosystem.

Best,
Yoshi
GitHub: @yksanjo

---

## 2. Email to Cursor Team

**To:** team@cursor.com
**Subject:** MCP Discovery - Let Cursor agents find tools automatically

---

Hi Cursor Team,

I'm building MCP Discovery API - infrastructure that lets AI agents discover the right MCP server for any task.

**Why this matters for Cursor:**
- Users don't need to manually configure every MCP server
- Agents can find the best tool based on the task
- Performance data helps choose reliable servers

**Example flow:**
1. User asks: "Help me query my PostgreSQL database"
2. Agent calls: `discover_mcp_server({ need: "postgresql database" })`
3. Returns: postgres-server with install command
4. Agent auto-installs and uses it

**Currently:**
- 24 servers indexed
- Semantic search + metrics
- Free for individual users

Would Cursor be interested in built-in discovery? Happy to discuss integration.

GitHub: https://github.com/yksanjo/mcp-discovery

Best,
Yoshi

---

## 3. Email to MCP Server Creators

**Subject:** Your MCP server is now discoverable by AI agents

---

Hi [Creator Name],

I'm Yoshi, creator of MCP Discovery API. I've indexed your **[Server Name]** MCP server in our discovery database.

**What this means:**
- AI agents using Claude, Cursor, etc. can now find your server automatically
- When someone asks "I need [your capability]", your server shows up

**Want to enhance your listing?**
1. **Verify** your server (adds trust badge) - Free
2. **Add metrics** monitoring (latency, uptime) - Free
3. **Update** description/capabilities - Free

Just reply to this email or open an issue on GitHub.

**Links:**
- Your listing: https://mcp-discovery-production.up.railway.app/api/v1/discover (search for "[server name]")
- GitHub: https://github.com/yksanjo/mcp-discovery

This helps your server get discovered by more users automatically.

Best,
Yoshi

---

## 4. Email to Windsurf/Codeium

**To:** support@codeium.com
**Subject:** MCP Discovery API - Tool discovery for Windsurf agents

---

Hi Codeium Team,

I built MCP Discovery API - a semantic search layer for MCP servers that enables AI agents to find the right tool for any task.

**Value for Windsurf:**
- Agents can discover MCP servers on-demand
- No need for users to pre-configure every tool
- Performance metrics help choose reliable options

**What's available:**
- 24 MCP servers indexed
- Semantic search with embeddings
- Latency/uptime tracking
- Free tier for users

**Integration options:**
1. Built-in tool in Windsurf
2. Recommended MCP server
3. API partnership

Would love to explore how MCP Discovery could enhance Windsurf.

GitHub: https://github.com/yksanjo/mcp-discovery
API: https://mcp-discovery-production.up.railway.app

Best,
Yoshi

---

## 5. Email to LangChain Team

**To:** hello@langchain.dev
**Subject:** MCP Discovery - Tool discovery for LangChain agents

---

Hi LangChain Team,

I built an open-source MCP server discovery API that could be valuable as a LangChain tool.

**Use case:**
```python
from langchain.tools import MCPDiscoveryTool

discovery = MCPDiscoveryTool(api_key="...")

# Agent can now discover MCP servers
result = discovery.run("I need to send emails")
# Returns: Gmail MCP server + install command
```

**Features:**
- Semantic search across 24 MCP servers
- Performance metrics (latency, uptime)
- Free tier (100 queries/mo)

Would you be interested in an official LangChain integration? I can submit a PR.

GitHub: https://github.com/yksanjo/mcp-discovery

Best,
Yoshi

---

## 6. Cold DM Template (Twitter/X)

```
Hey! Built MCP Discovery API - lets AI agents find the right MCP server for any task.

24 servers indexed, semantic search, free tier.

Would love your feedback: github.com/yksanjo/mcp-discovery
```

---

## 7. GitHub Issue Template (for Continue.dev, Zed, etc.)

**Title:** [Feature Request] Integrate MCP Discovery for automatic tool discovery

**Body:**

Hi team,

I'd like to propose integrating **MCP Discovery API** as a discovery layer for MCP servers.

**Problem:** Users must manually configure each MCP server they want to use.

**Solution:** MCP Discovery provides semantic search across MCP servers, letting agents find the right tool automatically.

**How it works:**
```
Agent: "I need to query a database"
→ Calls discover_mcp_server({ need: "database" })
→ Returns: postgres-server with install command
→ Agent can auto-install and use
```

**Benefits:**
- Better UX - no manual configuration
- Discovery of new tools based on task
- Performance data for reliability

**Resources:**
- GitHub: https://github.com/yksanjo/mcp-discovery
- API: https://mcp-discovery-production.up.railway.app
- Free tier available

Happy to help with integration or submit a PR.

---

## Quick Copy-Paste List

### Emails to Send:
1. developer-relations@anthropic.com
2. team@cursor.com
3. support@codeium.com
4. hello@langchain.dev

### GitHub Issues to Open:
1. https://github.com/continuedev/continue/issues
2. https://github.com/zed-industries/zed/issues
3. https://github.com/run-llama/llama_index/issues
4. https://github.com/Significant-Gravitas/AutoGPT/issues
5. https://github.com/joaomdmoura/crewAI/issues

### MCP Server Creators to Contact:
(Find on https://github.com/modelcontextprotocol/servers)
- Each server maintainer
- Focus on popular ones first
