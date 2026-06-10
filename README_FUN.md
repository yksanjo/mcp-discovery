# 🚨 MCP DISCOVERY 2.0 🚨

<p align="center">
  <img alt="Reaction GIF" src="https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif" width="300">
</p>

<h1 align="center">
  🔥 THE WORLD'S MOST COMPLETE MCP SERVER INDEX 🔥
</h1>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Servers-5,000%2B-red?style=for-the-badge&logo=fire" alt="Servers: 5,000+ badge"></a>
  <a href="#"><img src="https://img.shields.io/badge/Status-LIVE-brightgreen?style=for-the-badge" alt="Status: LIVE badge"></a>
  <a href="#"><img src="https://img.shields.io/badge/Built%20For-AI%20AGENTS-purple?style=for-the-badge&logo=robot" alt="Built for AI agents badge"></a>
</p>

<p align="center">
  <b>⚠️ WARNING: EXTREME UTILITY DETECTED ⚠️</b><br>
  <i>Your agents will NEVER ask "which MCP server should I use?" again.</i>
</p>

---

## 🎬 What Is This Madness?

<p align="center">
  <img alt="Reaction GIF" src="https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif" width="400">
</p>

**MCP Discovery** is like Google, but for AI agents looking for tools. Instead of searching for 10 minutes, your agent queries our API and gets the perfect MCP server in **50ms**.

**Think about it:**

- Human: "Help me analyze my GitHub repos"
- Agent: *calls API* → *gets github-server* → *installs* → *DONE*

No questions. No back-and-forth. Just pure autonomous tool discovery.

---

## 🚀 Quick Start (Copy-Paste and GO)

### 🔮 Semantic Search (The Magic Endpoint)

```bash
# Find any tool with natural language
curl -X POST https://mcp-discovery-two.vercel.app/api/v1/discover \
  -H "Content-Type: application/json" \
  -d '{"need": "send slack notifications"}'
```

**Returns:**

```json
{
  "recommendations": [
    {
      "server": "slack-server",
      "name": "Slack MCP Server", 
      "install_command": "npx -y @anthropic/mcp-server-slack",
      "confidence": 0.95,
      "description": "Official Slack integration for MCP"
    }
  ]
}
```

<p align="center">
  <img alt="Reaction GIF" src="https://media.giphy.com/media/3o7qE1YN7aPRx0p6Wk/giphy.gif" width="250">
</p>

---

## 📊 The Numbers (They Don't Lie)

| Metric | Value |
|--------|-------|
| **Total Servers** | 5,000+ and climbing 🚀 |
| **API Response Time** | ~50ms (faster than you can blink) |
| **Categories** | 20+ (from AI to 3D) |
| **Sources** | Glama, NPM, Official Registry, GitHub |

---

## 🎮 How It Works (The Cool Part)

<p align="center">
  <img alt="Reaction GIF" src="https://media.giphy.com/media/26ufnwz3wDUli7GD6/giphy.gif" width="350">
</p>

### Without MCP Discovery

```text
User: "I need to access a database"
Agent: "Which database? PostgreSQL? MySQL? MongoDB? Redis?"
User: "Uh... PostgreSQL I guess?"
Agent: "Which MCP server? There are 50 different ones..."
User: *googles for 10 minutes*
```

### With MCP Discovery

```text
User: "I need to access a database"
Agent: *calls API* *gets postgres-server* *installs* *DONE*
User: 😎
```

**Time saved:** 9 minutes 59.95 seconds

---

## 🛠️ Integration Examples

### Python Agents

```python
import requests

class AgentThatKnowsWhatsUp:
    def discover_tool(self, need: str):
        response = requests.post(
            "https://mcp-discovery-two.vercel.app/api/v1/discover",
            json={"need": need, "limit": 3}
        )
        return response.json()["recommendations"]

# Usage
agent = AgentThatKnowsWhatsUp()
tools = agent.discover_tool("I need to query a PostgreSQL database")
# Returns: postgres-server with install command ready to go!
```

### JavaScript Agents  

```javascript
async function discoverMCPTool(need) {
  const response = await fetch('https://mcp-discovery-two.vercel.app/api/v1/discover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ need, limit: 3 })
  });
  return response.json();
}

// Your agent just got smarter
discoverMCPTool("database for storing user preferences");
// Returns: sqlite-server, redis-server, postgres-server
```

---

## 📦 Database Downloads

Want the raw data? We got you:

| Format | File | Size |
|--------|------|------|
| JSON | `data/mcp_servers_complete.json` | ~3MB |
| CSV | `data/mcp_servers_complete.csv` | ~2MB |
| Markdown | `data/MCP_SERVERS_COMPLETE.md` | ~25KB |

---

## 🌟 API Reference

| Endpoint | Method | What It Does |
|----------|--------|--------------|
| `/health` | GET | Check if we're alive (spoiler: we are) |
| `/api/v1/discover` | POST | **THE MAGIC** - semantic search |
| `/api/v1/servers` | GET | Browse all servers |
| `/api/v1/categories` | GET | Get all categories |
| `/api/v1/servers/:slug` | GET | Get specific server |

---

## 🎭 Categories (Pick Your Poison)

<p align="center">
  <img alt="Reaction GIF" src="https://media.giphy.com/media/l0HlNd1sgO7RkYQEw/giphy.gif" width="300">
</p>

- 🗄️ **Database** - PostgreSQL, SQLite, MongoDB, Redis, and MORE
- 🤖 **AI/ML** - LLM integrations, model serving, inference
- 💻 **Development** - Git, GitHub, code analysis
- ☁️ **Cloud** - AWS, GCP, Azure integrations  
- 💬 **Communication** - Slack, Discord, email
- 🔒 **Security** - Auth, encryption, monitoring
- 📊 **Monitoring** - Metrics, logging, observability
- 🎨 **Design** - Image processing, 3D, creative tools
- 💰 **Finance** - Crypto, trading, payments
- 🔍 **Search** - Elasticsearch, semantic search
- ⚙️ **Automation** - CI/CD, workflows, bots
- And 10+ more!

---

## 🔥 Featured Servers

### The Classics (Everyone Needs These)

| Server | Install | Why You Want It |
|--------|---------|-----------------|
| **filesystem** | `npx -y @modelcontextprotocol/server-filesystem` | Read/write local files |
| **postgres** | `npx -y @modelcontextprotocol/server-postgres` | Database access |
| **github** | `npx -y @modelcontextprotocol/server-github` | GitHub API access |
| **slack** | `npx -y @anthropic/mcp-server-slack` | Slack notifications |
| **sqlite** | `npx -y @modelcontextprotocol/server-sqlite` | Lightweight DB |

---

## 🚦 Self-Hosting (For the Brave)

```bash
# Clone it
git clone https://github.com/yksanjo/mcp-discovery.git
cd mcp-discovery

# Install dependencies
npm install

# Configure
cp .env.example .env
# Edit .env with your Supabase & OpenAI keys

# Deploy
vercel --prod
```

**Requirements:**

- Supabase (PostgreSQL + pgvector)
- OpenAI API key (for embeddings)
- Vercel account (for hosting)

---

## 🎯 The Vision

<p align="center">
  <img alt="Reaction GIF" src="https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif" width="300">
</p>

**Today:** 5,000+ servers indexed  
**Tomorrow:** Every MCP server ever created  
**Next Week:** MCP servers discover OTHER MCP servers 🤯

The goal is simple: make AI agents truly autonomous by giving them access to every tool imaginable, instantly discoverable.

---

## 🤝 Contributing

Found a new MCP server? Want to add your own?

1. Fork this repo
2. Add your server to `scripts/seed-data.ts`
3. Submit a PR
4. Become LEGENDARY

---

## 📝 License

MIT - Do whatever you want, just don't blame us if your agent becomes TOO powerful 😉

---

<p align="center">
  <b>⭐ Star this repo if your agent found it useful ⭐</b><br>
  <i>Built with 🔥 by humans, for agents</i>
</p>

<p align="center">
  <img alt="Reaction GIF" src="https://media.giphy.com/media/26xBwdIuRJiAIq76g/giphy.gif" width="200">
</p>
