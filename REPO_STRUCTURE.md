# 📁 Repository Structure

```
mcp-discovery/
│
├── 📄 README.md                          ← 🎉 FUN README with GIFs
├── 📄 README_FUN.md                      ← Backup of fun version
├── 📄 LAUNCH.md                          ← 🚀 Launch announcement
├── 📄 DATABASE.md                        ← 📊 Database documentation
├── 📄 SCRAPING_SUMMARY.md                ← 🔧 Technical details
│
├── 📁 data/                              ← 💾 THE DATABASE
│   ├── mcp_servers_complete.json         ← 3.1MB, 5,468 servers
│   ├── mcp_servers_complete.csv          ← 1.7MB, spreadsheet format
│   ├── MCP_SERVERS_COMPLETE.md           ← 23KB, human-readable
│   └── summary.json                      ← Quick stats
│
├── 🔧 scrape_dramatic.py                 ← 🎭 FUN scraper with drama
├── 🔧 scrape_mcp_fast.py                 ← ⚡ Fast scraper
├── 🔧 scrape_all_mcp_servers.py          ← 🌊 Async scraper
├── 🔧 scrape_massive.py                  ← 🌍 Comprehensive scraper
│
├── 📁 scripts/
│   ├── seed-data.ts                      ← Original seed data
│   ├── seed-data-massive.ts              ← 5,000 servers seed
│   ├── scrape-glama-api.ts               ← Glama-specific scraper
│   └── ...
│
├── 📁 src/
│   ├── api.ts                            ← API endpoints
│   ├── types/index.ts                    ← TypeScript types
│   ├── db/                               ← Database client
│   └── services/                         ← Search, cache, etc.
│
├── 📁 api/
│   └── index.ts                          ← Vercel API handler
│
└── 📁 langchain/                         ← LangChain integration
    └── ...
```

## 🎯 Key Files

| File | Purpose | Size |
|------|---------|------|
| `data/mcp_servers_complete.json` | Complete database | 3.1 MB |
| `data/mcp_servers_complete.csv` | CSV format | 1.7 MB |
| `README.md` | Fun README with GIFs | ~7 KB |
| `LAUNCH.md` | Launch announcement | ~6 KB |
| `scrape_dramatic.py` | Fun scraper | 22 KB |

## 📊 Database Stats

- **Total Servers:** 5,468
- **Sources:** Glama (3,990), Awesome (1,500), NPM (653), Official (30)
- **Format:** JSON + CSV + Markdown
- **Size:** 4.9 MB total

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the dramatic scraper
python3 scrape_dramatic.py

# Or run the fast scraper
python3 scrape_mcp_fast.py

# View the data
ls -lh data/
```
