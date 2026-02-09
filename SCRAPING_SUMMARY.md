# MCP Server Scraping Summary

## Overview
Successfully scraped **5,468 unique MCP servers** from multiple sources.

## Data Sources

### 1. Glama.ai API
- **URL:** https://glama.ai/api/mcp/v1/servers
- **Servers Found:** 3,990 (before deduplication: 3,576 unique)
- **Method:** Paginated API requests with cursor-based pagination
- **Rate Limit:** ~100ms between requests

### 2. NPM Registry
- **URL:** https://registry.npmjs.org/-/v1/search
- **Packages Found:** 598 unique MCP-related packages
- **Search Terms:** `mcp-server`, `model-context-protocol`, `@modelcontextprotocol`
- **Method:** Registry search API

### 3. Awesome MCP Lists
- **Sources:** 
  - punkpeye/awesome-mcp-servers
  - wong2/awesome-mcp-servers
- **Servers Found:** 1,293 (many from GitHub repo links)
- **Method:** Markdown parsing for npm commands and GitHub URLs

### 4. Official MCP Registry
- **URL:** https://registry.modelcontextprotocol.io/v0.1/servers
- **Servers Found:** 30
- **Method:** Official registry API with cursor pagination

### 5. Smithery.ai
- **URL:** https://smithery.ai/api/servers
- **Servers Found:** 0 (API returned empty or access restricted)

### 6. GitHub Topics
- **Topics:** mcp-server, model-context-protocol
- **Method:** GitHub topic page scraping
- **Note:** Limited due to rate limiting

## Files Generated

### `/data/mcp_servers_complete.json` (3.2MB)
Complete JSON database with all server attributes:
- name, slug, description
- npm_package, github_url
- install_command, category
- source, author
- stars, downloads

### `/data/mcp_servers_complete.csv` (1.8MB)
CSV format for easy import into:
- Spreadsheets (Excel, Google Sheets)
- Databases (PostgreSQL, MySQL, SQLite)
- Data analysis tools (Pandas, R)

### `/data/MCP_SERVERS_COMPLETE.md` (23KB)
Human-readable documentation with:
- Top 100 servers by stars
- Category breakdown
- Full server list (top 500)

### `/data/summary.json`
JSON summary with statistics and category counts

### `DATABASE.md`
Database documentation and usage guide

### `scripts/seed-data-massive.ts` (2.4MB)
TypeScript seed file for database initialization
Contains 5,000 servers in seed format

## Scripts Created

1. **scrape_all_mcp_servers.py** - Initial async scraper (asyncio/aiohttp)
2. **scrape_mcp_fast.py** - Fast synchronous scraper
3. **scrape_massive.py** - Comprehensive scraper with all sources

## Deduplication

- **Before:** 6,173 servers
- **After:** 5,468 servers
- **Removed:** 705 duplicates (11.4%)

### Deduplication Strategy
- Key by npm package name (npm:package-name)
- Key by GitHub URL (github:owner/repo)
- Key by slug (slug:server-name)

## Categories Distribution

| Category | Approximate Count |
|----------|------------------|
| Other | 4,000+ |
| Database | 400 |
| Development | 350 |
| AI/ML | 200 |
| Communication | 150 |
| Cloud | 100 |
| Automation | 100 |
| Security | 50 |

## Next Steps to Reach 100,000+ Servers

1. **Additional Sources to Scrape:**
   - PyPI for Python MCP packages
   - Docker Hub for MCP container images
   - VS Code Marketplace for MCP extensions
   - JetBrains Marketplace

2. **Enhanced Scraping:**
   - GitHub Code Search API (with authentication)
   - GitLab registry
   - Bitbucket
   - Private registries

3. **Community Contributions:**
   - User submissions form
   - GitHub PR workflow
   - Automated daily scraping

4. **Data Enhancement:**
   - Fetch GitHub stars for all repos
   - Get NPM download stats
   - Add performance metrics
   - Include user ratings

## API Endpoints for Querying

```bash
# Semantic search
curl -X POST https://mcp-discovery-two.vercel.app/api/v1/discover \
  -H "Content-Type: application/json" \
  -d '{"need": "database access", "limit": 10}'

# List all categories
curl https://mcp-discovery-two.vercel.app/api/v1/categories

# Browse by category
curl "https://mcp-discovery-two.vercel.app/api/v1/servers?category=database&limit=50"

# Get server details
curl https://mcp-discovery-two.vercel.app/api/v1/servers/postgres-server
```

## Performance

- Scraping time: ~67 seconds
- API response time: ~50-200ms
- Database size: ~5MB (JSON + CSV)

## License

All scraped data is available under the same license as the repository (MIT).
Individual server packages may have their own licenses.
