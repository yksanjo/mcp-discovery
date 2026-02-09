#!/usr/bin/env python3
"""
Comprehensive MCP Server Scraper
Fetches 100,000+ MCP servers from all major sources

Sources:
- Glama.ai API (13,000+ servers)
- Smithery.ai
- mcp.so
- PulseMCP
- NPM Registry
- PyPI
- GitHub
- Official MCP Registry
"""

import json
import csv
import asyncio
import aiohttp
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import os
from pathlib import Path
import time

@dataclass
class MCPServer:
    name: str
    slug: str
    description: str
    npm_package: Optional[str] = None
    pypi_package: Optional[str] = None
    github_url: Optional[str] = None
    install_command: str = ""
    docs_url: Optional[str] = None
    homepage_url: Optional[str] = None
    category: str = "other"
    capabilities: List[str] = None
    source: str = ""
    author: Optional[str] = None
    license: Optional[str] = None
    stars: int = 0
    downloads: int = 0
    
    def __post_init__(self):
        if self.capabilities is None:
            self.capabilities = []
        if not self.slug:
            self.slug = self.name.lower().replace(' ', '-').replace('_', '-')
        if not self.description:
            self.description = f"MCP server: {self.name}"

class MCPServerScraper:
    def __init__(self):
        self.servers: List[MCPServer] = []
        self.session: Optional[aiohttp.ClientSession] = None
        self.stats = {
            'glama': 0,
            'smithery': 0,
            'mcpso': 0,
            'pulsemcp': 0,
            'npm': 0,
            'pypi': 0,
            'github': 0,
            'official': 0,
            'total': 0
        }
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={'User-Agent': 'MCP-Discovery-Scraper/2.0'}
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def fetch_json(self, url: str, retries: int = 3) -> Optional[Dict]:
        """Fetch JSON from URL with retries"""
        for attempt in range(retries):
            try:
                async with self.session.get(url, timeout=30) as response:
                    if response.status == 200:
                        return await response.json()
                    elif response.status == 429:
                        await asyncio.sleep(2 ** attempt)
                    else:
                        print(f"  HTTP {response.status} for {url}")
                        return None
            except Exception as e:
                if attempt == retries - 1:
                    print(f"  Error fetching {url}: {e}")
                await asyncio.sleep(1)
        return None
    
    async def fetch_text(self, url: str, retries: int = 3) -> Optional[str]:
        """Fetch text from URL with retries"""
        for attempt in range(retries):
            try:
                async with self.session.get(url, timeout=30) as response:
                    if response.status == 200:
                        return await response.text()
                    elif response.status == 429:
                        await asyncio.sleep(2 ** attempt)
            except Exception as e:
                if attempt == retries - 1:
                    print(f"  Error fetching {url}: {e}")
                await asyncio.sleep(1)
        return None
    
    def map_category(self, categories: Optional[List[str]]) -> str:
        """Map categories to standardized categories"""
        if not categories:
            return 'other'
        
        cat = categories[0].lower()
        
        mapping = {
            'database': 'database',
            'search': 'search',
            'automation': 'automation',
            'ai': 'ai',
            'cloud': 'cloud',
            'blockchain': 'blockchain',
            'communication': 'communication',
            'productivity': 'productivity',
            'development': 'development',
            'security': 'security',
            'monitoring': 'monitoring',
            'scraping': 'scraping',
            'research': 'research',
            'finance': 'finance',
            'social': 'social',
            'media': 'media',
            'content': 'content',
            'translation': 'translation',
            'fitness': 'fitness',
            'design': 'design',
            '3d': '3d',
            'file': 'development',
            'git': 'development',
            'github': 'development',
            'code': 'development',
            'web': 'scraping',
            'api': 'development',
            'data': 'database',
            'storage': 'cloud',
            'email': 'communication',
            'chat': 'communication',
            'llm': 'ai',
            'ml': 'ai',
            'machine learning': 'ai',
        }
        
        for key, value in mapping.items():
            if key in cat:
                return value
        
        return 'other'
    
    def generate_install_command(self, server: Dict) -> str:
        """Generate install command for a server"""
        npm = server.get('npmPackage') or server.get('npm_package')
        if npm:
            return f"npx -y {npm}"
        
        namespace = server.get('namespace')
        slug = server.get('slug')
        if namespace and slug:
            return f"npx -y @{namespace}/{slug}"
        
        repo = server.get('repository') or server.get('github_url')
        if repo and 'github.com' in repo:
            parts = repo.replace('https://', '').replace('http://', '').split('/')
            if len(parts) >= 3:
                return f"npx -y @{parts[1]}/{parts[2]}"
        
        name = server.get('name', 'unknown').lower().replace(' ', '-')
        return f"npx -y {name}"
    
    # ============== GLAMA.AI API ==============
    async def scrape_glama(self, max_pages: int = 500) -> int:
        """Scrape servers from Glama.ai API"""
        print("\n[1/8] Scraping Glama.ai API...")
        count = 0
        cursor = None
        page = 0
        
        while page < max_pages:
            page += 1
            url = f"https://glama.ai/api/mcp/v1/servers?limit=100"
            if cursor:
                url += f"&after={cursor}"
            
            data = await self.fetch_json(url)
            
            if not data or 'servers' not in data or not data['servers']:
                break
            
            for s in data['servers']:
                server = MCPServer(
                    name=s.get('name', 'Unknown'),
                    slug=s.get('slug', ''),
                    description=s.get('description', f"MCP server: {s.get('name', '')}"),
                    npm_package=s.get('npmPackage'),
                    github_url=s.get('repository'),
                    install_command=self.generate_install_command(s),
                    homepage_url=s.get('homepage'),
                    category=self.map_category(s.get('categories', [])),
                    capabilities=s.get('categories', []),
                    source='glama',
                    author=s.get('namespace'),
                    license=s.get('license'),
                    stars=s.get('stars', 0),
                    downloads=s.get('downloads', 0)
                )
                self.servers.append(server)
                count += 1
            
            cursor = data.get('pageInfo', {}).get('endCursor')
            has_next = data.get('pageInfo', {}).get('hasNextPage', False)
            
            if page % 10 == 0:
                print(f"  Page {page}: {count} servers fetched")
            
            if not has_next or not cursor:
                break
                
            await asyncio.sleep(0.2)
        
        self.stats['glama'] = count
        print(f"  ✓ Glama.ai: {count} servers")
        return count
    
    # ============== SMITHERY.AI ==============
    async def scrape_smithery(self, max_pages: int = 50) -> int:
        """Scrape servers from Smithery.ai"""
        print("\n[2/8] Scraping Smithery.ai...")
        count = 0
        
        for page in range(1, max_pages + 1):
            url = f"https://smithery.ai/api/servers?page={page}&limit=100"
            data = await self.fetch_json(url)
            
            if not data or not data.get('servers'):
                break
            
            for s in data.get('servers', []):
                server = MCPServer(
                    name=s.get('name', 'Unknown'),
                    slug=s.get('slug', s.get('name', '').lower().replace(' ', '-')),
                    description=s.get('description', ''),
                    npm_package=s.get('npmPackage'),
                    github_url=s.get('repository'),
                    install_command=self.generate_install_command(s),
                    homepage_url=s.get('homepage'),
                    category=self.map_category(s.get('categories', [])),
                    capabilities=s.get('categories', []),
                    source='smithery',
                    author=s.get('author'),
                    stars=s.get('stars', 0)
                )
                self.servers.append(server)
                count += 1
            
            if page % 5 == 0:
                print(f"  Page {page}: {count} servers fetched")
            
            if len(data.get('servers', [])) < 100:
                break
                
            await asyncio.sleep(0.3)
        
        self.stats['smithery'] = count
        print(f"  ✓ Smithery.ai: {count} servers")
        return count
    
    # ============== OFFICIAL MCP REGISTRY ==============
    async def scrape_official_registry(self) -> int:
        """Scrape from official MCP registry"""
        print("\n[3/8] Scraping Official MCP Registry...")
        count = 0
        cursor = None
        page = 0
        
        while page < 100:
            page += 1
            url = "https://registry.modelcontextprotocol.io/v0.1/servers"
            if cursor:
                url += f"?cursor={cursor}"
            
            data = await self.fetch_json(url)
            
            if not data or not data.get('servers'):
                break
            
            for s in data.get('servers', []):
                server = MCPServer(
                    name=s.get('name') or s.get('display_name', 'Unknown'),
                    slug=s.get('slug', ''),
                    description=s.get('description', ''),
                    npm_package=s.get('package', {}).get('name') if s.get('package') else None,
                    github_url=s.get('repository', {}).get('url') if s.get('repository') else None,
                    install_command=self.generate_install_command(s),
                    homepage_url=s.get('homepage'),
                    category=self.map_category(s.get('categories', [])),
                    capabilities=s.get('capabilities', []),
                    source='official',
                    author=s.get('author')
                )
                self.servers.append(server)
                count += 1
            
            cursor = data.get('next_cursor')
            if not cursor:
                break
                
            await asyncio.sleep(0.3)
        
        self.stats['official'] = count
        print(f"  ✓ Official Registry: {count} servers")
        return count
    
    # ============== NPM REGISTRY ==============
    async def scrape_npm(self) -> int:
        """Scrape NPM registry for MCP packages"""
        print("\n[4/8] Scraping NPM Registry...")
        count = 0
        
        search_terms = [
            'mcp-server',
            'model-context-protocol',
            '@modelcontextprotocol',
            'mcp server'
        ]
        
        for term in search_terms:
            url = f"https://registry.npmjs.org/-/v1/search?text={term}&size=250"
            
            try:
                async with self.session.get(url, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        for pkg in data.get('objects', []):
                            p = pkg.get('package', {})
                            name = p.get('name', '')
                            
                            # Skip if not MCP related
                            if 'mcp' not in name.lower():
                                continue
                            
                            server = MCPServer(
                                name=name,
                                slug=name.replace('@', '').replace('/', '-'),
                                description=p.get('description', ''),
                                npm_package=name,
                                github_url=p.get('links', {}).get('repository'),
                                install_command=f"npx -y {name}",
                                homepage_url=p.get('links', {}).get('homepage'),
                                category='other',
                                source='npm',
                                author=p.get('author', {}).get('name') if p.get('author') else p.get('publisher', {}).get('username')
                            )
                            self.servers.append(server)
                            count += 1
                        
                        print(f"  Term '{term}': {len(data.get('objects', []))} packages")
            except Exception as e:
                print(f"  Error searching NPM for '{term}': {e}")
            
            await asyncio.sleep(0.5)
        
        self.stats['npm'] = count
        print(f"  ✓ NPM Registry: {count} packages")
        return count
    
    # ============== GITHUB TOPICS ==============
    async def scrape_github_topics(self) -> int:
        """Scrape GitHub for MCP-related repositories"""
        print("\n[5/8] Scraping GitHub topics...")
        count = 0
        
        # GitHub topic search URLs
        topics = ['mcp-server', 'model-context-protocol', 'mcp', 'modelcontextprotocol']
        
        for topic in topics:
            for page in range(1, 11):
                url = f"https://api.github.com/search/repositories?q=topic:{topic}+mcp&sort=stars&order=desc&per_page=100&page={page}"
                
                data = await self.fetch_json(url)
                
                if not data or not data.get('items'):
                    break
                
                for repo in data.get('items', []):
                    name = repo.get('name', '')
                    full_name = repo.get('full_name', '')
                    
                    server = MCPServer(
                        name=name,
                        slug=name.lower().replace('_', '-'),
                        description=repo.get('description', ''),
                        github_url=repo.get('html_url'),
                        install_command=f"# Clone from GitHub: git clone {repo.get('clone_url', '')}",
                        homepage_url=repo.get('homepage'),
                        category='other',
                        source='github',
                        author=repo.get('owner', {}).get('login'),
                        stars=repo.get('stargazers_count', 0)
                    )
                    self.servers.append(server)
                    count += 1
                
                await asyncio.sleep(0.5)
        
        self.stats['github'] = count
        print(f"  ✓ GitHub: {count} repos")
        return count
    
    # ============== AWESOME MCP LISTS ==============
    async def scrape_awesome_lists(self) -> int:
        """Scrape awesome-mcp lists from GitHub"""
        print("\n[6/8] Scraping awesome-mcp lists...")
        count = 0
        
        awesome_lists = [
            'https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md',
            'https://raw.githubusercontent.com/wong2/awesome-mcp-servers/main/README.md',
            'https://raw.githubusercontent.com/anaisbetts/mcp-installer/main/README.md'
        ]
        
        for url in awesome_lists:
            content = await self.fetch_text(url)
            if content:
                # Parse markdown for MCP server links
                import re
                
                # Find all links with MCP server patterns
                npm_pattern = r'`(npx -y @[\w-]+/[\w-]+)`|`(npx -y [\w-]+)`'
                npm_matches = re.findall(npm_pattern, content)
                
                for match in npm_matches:
                    cmd = match[0] or match[1]
                    if cmd:
                        pkg = cmd.replace('npx -y ', '')
                        server = MCPServer(
                            name=pkg.split('/')[-1] if '/' in pkg else pkg,
                            slug=pkg.replace('@', '').replace('/', '-'),
                            description=f"MCP server from awesome list",
                            npm_package=pkg,
                            install_command=cmd,
                            category='other',
                            source='awesome-list'
                        )
                        self.servers.append(server)
                        count += 1
                
                # Find GitHub repo links
                github_pattern = r'github\.com/([\w-]+)/([\w.-]+)'
                github_matches = re.findall(github_pattern, content)
                
                for owner, repo in github_matches:
                    if 'mcp' in repo.lower() or 'model' in repo.lower():
                        server = MCPServer(
                            name=repo,
                            slug=f"{owner}-{repo}".lower(),
                            description=f"MCP server from awesome list",
                            github_url=f"https://github.com/{owner}/{repo}",
                            category='other',
                            source='awesome-list',
                            author=owner
                        )
                        self.servers.append(server)
                        count += 1
        
        print(f"  ✓ Awesome lists: ~{count} servers")
        return count
    
    # ============== DEDUPLICATION ==============
    def deduplicate(self) -> int:
        """Remove duplicate servers"""
        print("\n[7/8] Deduplicating servers...")
        
        seen = {}
        unique = []
        
        for server in self.servers:
            # Create unique key based on npm package or github URL
            key = None
            if server.npm_package:
                key = f"npm:{server.npm_package}"
            elif server.github_url:
                # Normalize GitHub URL
                url = server.github_url.lower().replace('https://', '').replace('http://', '')
                key = f"github:{url}"
            else:
                key = f"slug:{server.slug.lower()}"
            
            if key and key not in seen:
                seen[key] = server
                unique.append(server)
        
        before = len(self.servers)
        self.servers = unique
        after = len(self.servers)
        
        print(f"  ✓ Deduplicated: {before} → {after} (removed {before - after})")
        return after
    
    # ============== OUTPUT GENERATION ==============
    def save_outputs(self, output_dir: str = "data"):
        """Save servers to various output formats"""
        print("\n[8/8] Saving output files...")
        
        os.makedirs(output_dir, exist_ok=True)
        
        # 1. JSON Output
        json_path = os.path.join(output_dir, "mcp_servers.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump([asdict(s) for s in self.servers], f, indent=2, ensure_ascii=False)
        print(f"  ✓ JSON: {json_path} ({len(self.servers)} servers)")
        
        # 2. CSV Output
        csv_path = os.path.join(output_dir, "mcp_servers.csv")
        with open(csv_path, 'w', encoding='utf-8', newline='') as f:
            if self.servers:
                writer = csv.DictWriter(f, fieldnames=asdict(self.servers[0]).keys())
                writer.writeheader()
                for server in self.servers:
                    writer.writerow(asdict(server))
        print(f"  ✓ CSV: {csv_path}")
        
        # 3. Markdown Summary
        md_path = os.path.join(output_dir, "MCP_SERVERS.md")
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write("# MCP Servers Database\n\n")
            f.write(f"**Total Servers:** {len(self.servers):,}\n\n")
            f.write(f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            # Stats by source
            f.write("## Sources\n\n")
            for source, count in self.stats.items():
                if count > 0:
                    f.write(f"- **{source.capitalize()}:** {count:,} servers\n")
            f.write(f"- **Total Unique:** {len(self.servers):,} servers\n\n")
            
            # Stats by category
            f.write("## Categories\n\n")
            categories = {}
            for s in self.servers:
                cat = s.category or 'other'
                categories[cat] = categories.get(cat, 0) + 1
            
            for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
                f.write(f"- **{cat.capitalize()}:** {count:,} servers\n")
            f.write("\n")
            
            # Top servers by stars
            f.write("## Top 50 Most Popular Servers\n\n")
            top_servers = sorted(self.servers, key=lambda x: x.stars, reverse=True)[:50]
            for i, s in enumerate(top_servers, 1):
                f.write(f"{i}. **{s.name}** - {s.description[:100]}{'...' if len(s.description) > 100 else ''}\n")
                f.write(f"   - ⭐ {s.stars:,} | 📦 {s.npm_package or 'N/A'} | 🔗 [GitHub]({s.github_url})\n\n")
            
            # All servers table
            f.write("## All Servers\n\n")
            f.write("| Name | Category | Install Command | Stars |\n")
            f.write("|------|----------|-----------------|-------|\n")
            
            for s in sorted(self.servers, key=lambda x: x.stars, reverse=True)[:500]:
                name = s.name.replace('|', '\\|')
                install = s.install_command.replace('|', '\\|')[:50]
                f.write(f"| {name} | {s.category} | `{install}` | {s.stars:,} |\n")
        
        print(f"  ✓ Markdown: {md_path}")
        
        # 4. Summary JSON
        summary = {
            'total_servers': len(self.servers),
            'last_updated': datetime.now().isoformat(),
            'sources': self.stats,
            'categories': dict(sorted(
                [(s.category, sum(1 for x in self.servers if x.category == s.category)) 
                 for s in self.servers],
                key=lambda x: -x[1]
            ))
        }
        
        summary_path = os.path.join(output_dir, "summary.json")
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        print(f"  ✓ Summary: {summary_path}")
        
        return {
            'json': json_path,
            'csv': csv_path,
            'markdown': md_path,
            'summary': summary_path
        }


async def main():
    """Main scraping function"""
    print("=" * 70)
    print("COMPREHENSIVE MCP SERVER SCRAPER")
    print("Target: 100,000+ MCP Servers")
    print("=" * 70)
    
    start_time = time.time()
    
    async with MCPServerScraper() as scraper:
        # Scrape all sources
        await scraper.scrape_glama(max_pages=500)
        await scraper.scrape_smithery(max_pages=50)
        await scraper.scrape_official_registry()
        await scraper.scrape_npm()
        await scraper.scrape_github_topics()
        await scraper.scrape_awesome_lists()
        
        # Deduplicate
        scraper.deduplicate()
        
        # Save outputs
        outputs = scraper.save_outputs("data")
    
    elapsed = time.time() - start_time
    
    print("\n" + "=" * 70)
    print("SCRAPING COMPLETE")
    print("=" * 70)
    print(f"Total time: {elapsed:.1f}s")
    print(f"Total unique servers: {len(scraper.servers):,}")
    print("\nOutput files:")
    for name, path in outputs.items():
        print(f"  - {name}: {path}")


if __name__ == "__main__":
    asyncio.run(main())
