#!/usr/bin/env python3
"""
Massive MCP Server Scraper - Get ALL available servers
Target: Maximum possible servers from all sources
"""

import json
import csv
import requests
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import os
import time

@dataclass
class MCPServer:
    name: str
    slug: str
    description: str
    npm_package: Optional[str] = None
    github_url: Optional[str] = None
    install_command: str = ""
    docs_url: Optional[str] = None
    homepage_url: Optional[str] = None
    category: str = "other"
    source: str = ""
    author: Optional[str] = None
    stars: int = 0
    downloads: int = 0

class MassiveScraper:
    def __init__(self):
        self.servers: List[MCPServer] = []
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        self.stats = {
            'glama': 0, 'smithery': 0, 'official': 0, 'npm': 0, 
            'github_search': 0, 'github_topics': 0, 'awesome': 0, 'pypi': 0,
            'mcp_so': 0, 'pulsemcp': 0
        }
    
    def add_server(self, server: MCPServer):
        self.servers.append(server)
    
    # ============== GLAMA.AI ==============
    def scrape_glama_unlimited(self):
        """Scrape ALL servers from Glama"""
        print("\n[1/9] Scraping Glama.ai (all pages)...")
        count = 0
        cursor = None
        page = 0
        
        while True:
            page += 1
            try:
                url = "https://glama.ai/api/mcp/v1/servers?limit=100"
                if cursor:
                    url += f"&after={cursor}"
                
                response = self.session.get(url, timeout=30)
                if response.status_code != 200:
                    print(f"  HTTP {response.status_code} at page {page}")
                    break
                
                data = response.json()
                servers = data.get('servers', [])
                
                if not servers:
                    print(f"  No more servers at page {page}")
                    break
                
                for s in servers:
                    npm = s.get('npmPackage')
                    repo = s.get('repository')
                    
                    # Generate install command
                    install = f"npx -y {npm}" if npm else ""
                    if not install and s.get('namespace') and s.get('slug'):
                        install = f"npx -y @{s['namespace']}/{s['slug']}"
                    
                    self.add_server(MCPServer(
                        name=s.get('name', 'Unknown'),
                        slug=s.get('slug') or s.get('name', '').lower().replace(' ', '-'),
                        description=s.get('description', f"MCP server: {s.get('name', '')}"),
                        npm_package=npm,
                        github_url=repo,
                        install_command=install,
                        homepage_url=s.get('homepage'),
                        category=self._map_category(s.get('categories', [])),
                        source='glama',
                        author=s.get('namespace'),
                        stars=s.get('stars', 0),
                        downloads=s.get('downloads', 0)
                    ))
                    count += 1
                
                if page % 50 == 0:
                    print(f"  Page {page}: {count} servers total")
                
                # Pagination
                cursor = data.get('pageInfo', {}).get('endCursor')
                has_next = data.get('pageInfo', {}).get('hasNextPage', False)
                
                if not has_next or not cursor:
                    print(f"  End of pagination at page {page}")
                    break
                
                # Small delay to be nice to API
                time.sleep(0.1)
                
            except Exception as e:
                print(f"  Error at page {page}: {e}")
                break
        
        self.stats['glama'] = count
        print(f"  ✓ Glama.ai: {count} servers")
        return count
    
    def _map_category(self, categories):
        if not categories:
            return 'other'
        cat = categories[0].lower()
        mapping = {
            'database': 'database', 'search': 'search', 'automation': 'automation',
            'ai': 'ai', 'cloud': 'cloud', 'blockchain': 'blockchain',
            'communication': 'communication', 'productivity': 'productivity',
            'development': 'development', 'security': 'security', 'monitoring': 'monitoring',
            'scraping': 'scraping', 'research': 'research', 'finance': 'finance',
            'social': 'social', 'media': 'media', 'content': 'content',
            'translation': 'translation', 'fitness': 'fitness', 'design': 'design',
            '3d': '3d', 'file': 'development', 'git': 'development', 'github': 'development',
            'code': 'development', 'web': 'scraping', 'api': 'development',
            'data': 'database', 'storage': 'cloud', 'email': 'communication',
            'chat': 'communication', 'llm': 'ai', 'ml': 'ai', 'machine learning': 'ai',
        }
        for key, value in mapping.items():
            if key in cat:
                return value
        return 'other'
    
    # ============== OFFICIAL REGISTRY ==============
    def scrape_official(self):
        """Scrape official MCP registry"""
        print("\n[2/9] Scraping Official Registry...")
        count = 0
        cursor = None
        
        for _ in range(200):
            try:
                url = "https://registry.modelcontextprotocol.io/v0.1/servers"
                if cursor:
                    url += f"?cursor={cursor}"
                
                response = self.session.get(url, timeout=30)
                if response.status_code != 200:
                    break
                
                data = response.json()
                servers = data.get('servers', [])
                if not servers:
                    break
                
                for s in servers:
                    pkg = s.get('package', {})
                    repo = s.get('repository', {})
                    
                    install = ""
                    if pkg.get('name'):
                        install = f"npx -y {pkg['name']}"
                    
                    self.add_server(MCPServer(
                        name=s.get('display_name') or s.get('name', 'Unknown'),
                        slug=s.get('slug', ''),
                        description=s.get('description', ''),
                        npm_package=pkg.get('name'),
                        github_url=repo.get('url'),
                        install_command=install,
                        homepage_url=s.get('homepage'),
                        category=self._map_category(s.get('categories', [])),
                        source='official',
                        author=s.get('author')
                    ))
                    count += 1
                
                cursor = data.get('next_cursor')
                if not cursor:
                    break
                time.sleep(0.2)
                
            except Exception as e:
                break
        
        self.stats['official'] = count
        print(f"  ✓ Official: {count} servers")
        return count
    
    # ============== NPM REGISTRY ==============
    def scrape_npm_deep(self):
        """Deep scrape NPM for all MCP packages"""
        print("\n[3/9] Scraping NPM Registry (deep)...")
        count = 0
        
        search_terms = [
            'mcp-server', 'model-context-protocol', '@modelcontextprotocol',
            'mcp', 'model context protocol', 'anthropic-mcp', 'mcp-anthropic'
        ]
        
        all_packages = set()
        
        for term in search_terms:
            for page in range(0, 5):
                try:
                    url = f"https://registry.npmjs.org/-/v1/search?text={term}&size=250&from={page*250}"
                    response = self.session.get(url, timeout=30)
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        for pkg in data.get('objects', []):
                            p = pkg.get('package', {})
                            name = p.get('name', '')
                            
                            # Filter for MCP-related packages
                            if 'mcp' not in name.lower():
                                continue
                            if name in all_packages:
                                continue
                            
                            all_packages.add(name)
                            
                            self.add_server(MCPServer(
                                name=name,
                                slug=name.replace('@', '').replace('/', '-'),
                                description=p.get('description', ''),
                                npm_package=name,
                                github_url=p.get('links', {}).get('repository'),
                                install_command=f"npx -y {name}",
                                homepage_url=p.get('links', {}).get('homepage'),
                                source='npm',
                                author=p.get('author', {}).get('name') if p.get('author') else None
                            ))
                            count += 1
                        
                        if len(data.get('objects', [])) < 250:
                            break
                            
                except Exception as e:
                    pass
                
                time.sleep(0.3)
        
        self.stats['npm'] = count
        print(f"  ✓ NPM: {count} packages")
        return count
    
    # ============== AWESOME LISTS ==============
    def scrape_awesome_lists(self):
        """Scrape awesome MCP lists comprehensively"""
        print("\n[4/9] Scraping awesome-mcp lists...")
        count = 0
        
        awesome_lists = [
            'https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md',
            'https://raw.githubusercontent.com/wong2/awesome-mcp-servers/main/README.md',
            'https://raw.githubusercontent.com/modelcontextprotocol/servers/main/README.md',
            'https://raw.githubusercontent.com/anaisbetts/mcp-installer/main/README.md',
            'https://raw.githubusercontent.com/tadata-org/mcp-server-samples/main/README.md',
        ]
        
        seen_npm = set()
        seen_github = set()
        
        for url in awesome_lists:
            try:
                response = self.session.get(url, timeout=30)
                if response.status_code != 200:
                    continue
                
                content = response.text
                
                # Find npm/npx commands
                npm_patterns = [
                    r'`(npx -y @[\w\-]+/[\w\-]+)`',
                    r'`(npx -y [\w\-]+)`',
                    r'`(npm install @[\w\-]+/[\w\-]+)`',
                    r'`(npm install [\w\-]+)`',
                ]
                
                for pattern in npm_patterns:
                    matches = re.findall(pattern, content)
                    for cmd in matches:
                        pkg = cmd.replace('npx -y ', '').replace('npm install ', '')
                        if pkg in seen_npm:
                            continue
                        seen_npm.add(pkg)
                        
                        self.add_server(MCPServer(
                            name=pkg.split('/')[-1] if '/' in pkg else pkg,
                            slug=pkg.replace('@', '').replace('/', '-'),
                            description=f"MCP server from awesome list",
                            npm_package=pkg,
                            install_command=f"npx -y {pkg}" if 'npx' not in cmd else cmd,
                            source='awesome-list'
                        ))
                        count += 1
                
                # Find GitHub repos
                github_patterns = [
                    r'https?://github\.com/([\w\-]+)/([\w\-.]+)',
                    r'github\.com/([\w\-]+)/([\w\-.]+)',
                ]
                
                for pattern in github_patterns:
                    matches = re.findall(pattern, content)
                    for owner, repo in matches:
                        key = f"{owner}/{repo}"
                        if key in seen_github or 'mcp' not in repo.lower():
                            continue
                        seen_github.add(key)
                        
                        self.add_server(MCPServer(
                            name=repo,
                            slug=f"{owner}-{repo}".lower(),
                            description=f"MCP server from awesome list",
                            github_url=f"https://github.com/{owner}/{repo}",
                            source='awesome-list',
                            author=owner
                        ))
                        count += 1
                        
            except Exception as e:
                pass
        
        self.stats['awesome'] = count
        print(f"  ✓ Awesome lists: {count} servers")
        return count
    
    # ============== GITHUB TOPICS ==============
    def scrape_github_topics(self):
        """Scrape GitHub topics for MCP repos"""
        print("\n[5/9] Scraping GitHub topics...")
        count = 0
        
        # Use GitHub search via html scraping
        topics = ['mcp-server', 'model-context-protocol', 'mcp']
        
        for topic in topics:
            for page in range(1, 10):
                try:
                    url = f"https://github.com/topics/{topic}?page={page}"
                    response = self.session.get(url, timeout=30)
                    
                    if response.status_code == 200:
                        html = response.text
                        # Extract repo names from topic page
                        repos = re.findall(r'href="/([\w\-]+/[\w\-.]+)"', html)
                        
                        for repo in set(repos):
                            if 'mcp' in repo.lower():
                                parts = repo.split('/')
                                if len(parts) == 2:
                                    self.add_server(MCPServer(
                                        name=parts[1],
                                        slug=repo.replace('/', '-').lower(),
                                        description=f"MCP server from GitHub topic {topic}",
                                        github_url=f"https://github.com/{repo}",
                                        source='github-topics',
                                        author=parts[0]
                                    ))
                                    count += 1
                        
                except Exception as e:
                    pass
                
                time.sleep(0.5)
        
        self.stats['github_topics'] = count
        print(f"  ✓ GitHub topics: {count} repos")
        return count
    
    # ============== SMITHERY ==============
    def scrape_smithery(self):
        """Scrape Smithery.ai"""
        print("\n[6/9] Scraping Smithery.ai...")
        count = 0
        
        for page in range(1, 100):
            try:
                url = f"https://smithery.ai/api/servers?page={page}&limit=100"
                response = self.session.get(url, timeout=30)
                
                if response.status_code != 200:
                    break
                
                data = response.json()
                servers = data.get('servers', [])
                if not servers:
                    break
                
                for s in servers:
                    install = ""
                    if s.get('npmPackage'):
                        install = f"npx -y {s['npmPackage']}"
                    
                    self.add_server(MCPServer(
                        name=s.get('name', 'Unknown'),
                        slug=s.get('slug', ''),
                        description=s.get('description', ''),
                        npm_package=s.get('npmPackage'),
                        github_url=s.get('repository'),
                        install_command=install,
                        homepage_url=s.get('homepage'),
                        category=self._map_category(s.get('categories', [])),
                        source='smithery',
                        author=s.get('author'),
                        stars=s.get('stars', 0)
                    ))
                    count += 1
                
                if len(servers) < 100:
                    break
                    
                time.sleep(0.2)
                
            except Exception as e:
                break
        
        self.stats['smithery'] = count
        print(f"  ✓ Smithery: {count} servers")
        return count
    
    # ============== MCP.SO ==============
    def scrape_mcp_so(self):
        """Scrape mcp.so"""
        print("\n[7/9] Scraping mcp.so...")
        count = 0
        
        try:
            url = "https://mcp.so/api/servers"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                for s in data.get('servers', []):
                    self.add_server(MCPServer(
                        name=s.get('name', 'Unknown'),
                        slug=s.get('slug', s.get('name', '').lower().replace(' ', '-')),
                        description=s.get('description', ''),
                        npm_package=s.get('npmPackage'),
                        github_url=s.get('githubUrl'),
                        install_command=f"npx -y {s['npmPackage']}" if s.get('npmPackage') else "",
                        homepage_url=s.get('homepage'),
                        source='mcp.so'
                    ))
                    count += 1
                    
        except Exception as e:
            pass
        
        self.stats['mcp_so'] = count
        print(f"  ✓ mcp.so: {count} servers")
        return count
    
    # ============== PULSE MCP ==============
    def scrape_pulsemcp(self):
        """Scrape PulseMCP"""
        print("\n[8/9] Scraping PulseMCP...")
        count = 0
        
        try:
            url = "https://www.pulsemcp.com/api/servers"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                for s in data.get('servers', []):
                    self.add_server(MCPServer(
                        name=s.get('name', 'Unknown'),
                        slug=s.get('slug', ''),
                        description=s.get('description', ''),
                        github_url=s.get('githubUrl'),
                        install_command=s.get('installCommand', ''),
                        homepage_url=s.get('homepage'),
                        category=s.get('category', 'other'),
                        source='pulsemcp'
                    ))
                    count += 1
                    
        except Exception as e:
            pass
        
        self.stats['pulsemcp'] = count
        print(f"  ✓ PulseMCP: {count} servers")
        return count
    
    # ============== DEDUPLICATION ==============
    def deduplicate(self):
        """Remove duplicates"""
        print("\n[9/9] Deduplicating...")
        
        seen = {}
        unique = []
        
        for server in self.servers:
            key = None
            
            if server.npm_package and isinstance(server.npm_package, str):
                key = f"npm:{server.npm_package.lower()}"
            elif server.github_url and isinstance(server.github_url, str):
                url = server.github_url.lower().replace('https://', '').replace('http://', '').rstrip('/')
                key = f"github:{url}"
            else:
                key = f"slug:{server.slug.lower()}"
            
            if key and key not in seen:
                seen[key] = server
                unique.append(server)
        
        before = len(self.servers)
        self.servers = unique
        after = len(self.servers)
        
        print(f"  ✓ {before:,} → {after:,} (removed {before - after:,})")
        return after
    
    # ============== OUTPUT ==============
    def save_outputs(self, output_dir: str = "data_massive"):
        """Save all outputs"""
        print("\n" + "="*70)
        print("SAVING OUTPUTS")
        print("="*70)
        
        os.makedirs(output_dir, exist_ok=True)
        
        # JSON
        json_path = os.path.join(output_dir, "mcp_servers_all.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump([asdict(s) for s in self.servers], f, indent=2, ensure_ascii=False)
        print(f"  ✓ JSON: {json_path} ({len(self.servers):,} servers)")
        
        # CSV
        csv_path = os.path.join(output_dir, "mcp_servers_all.csv")
        with open(csv_path, 'w', encoding='utf-8', newline='') as f:
            if self.servers:
                writer = csv.DictWriter(f, fieldnames=asdict(self.servers[0]).keys())
                writer.writeheader()
                for server in self.servers:
                    writer.writerow(asdict(server))
        print(f"  ✓ CSV: {csv_path}")
        
        # Markdown with full list
        md_path = os.path.join(output_dir, "MCP_SERVERS_ALL.md")
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write("# MCP Servers Database - Complete Collection\n\n")
            f.write(f"**Total Servers:** {len(self.servers):,}\n\n")
            f.write(f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            # Sources
            f.write("## Sources\n\n")
            for source, count in sorted(self.stats.items(), key=lambda x: -x[1]):
                if count > 0:
                    f.write(f"- **{source.capitalize()}:** {count:,} servers\n")
            f.write(f"- **Total Unique:** {len(self.servers):,} servers\n\n")
            
            # Categories
            categories = {}
            for s in self.servers:
                cat = s.category or 'other'
                categories[cat] = categories.get(cat, 0) + 1
            
            f.write("## Categories\n\n")
            for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
                f.write(f"- **{cat.capitalize()}:** {count:,}\n")
            f.write("\n")
            
            # Top 200 by stars
            f.write("## Top 200 Servers by Stars\n\n")
            top = sorted(self.servers, key=lambda x: x.stars, reverse=True)[:200]
            for i, s in enumerate(top, 1):
                f.write(f"{i}. **{s.name}** (⭐ {s.stars:,} | 📥 {s.downloads:,})\n")
                f.write(f"   - {s.description[:150]}{'...' if len(s.description) > 150 else ''}\n")
                if s.npm_package:
                    f.write(f"   - Install: `{s.install_command}`\n")
                if s.github_url:
                    f.write(f"   - GitHub: {s.github_url}\n")
                f.write(f"   - Source: {s.source}\n\n")
            
            # Full list
            f.write("## Complete Server List\n\n")
            f.write("| # | Name | Category | Source | Install |\n")
            f.write("|---|------|----------|--------|---------|\n")
            
            for i, s in enumerate(sorted(self.servers, key=lambda x: x.stars, reverse=True), 1):
                name = s.name.replace('|', '\\|')[:40]
                install = s.install_command.replace('|', '\\|')[:40] if s.install_command else "N/A"
                f.write(f"| {i} | {name} | {s.category} | {s.source} | `{install}` |\n")
        
        print(f"  ✓ Markdown: {md_path}")
        
        # Summary JSON
        summary = {
            'total_servers': len(self.servers),
            'last_updated': datetime.now().isoformat(),
            'sources': self.stats,
            'categories': dict(sorted(
                [(cat, sum(1 for x in self.servers if x.category == cat)) 
                 for cat in set(s.category for s in self.servers)],
                key=lambda x: -x[1]
            ))
        }
        
        summary_path = os.path.join(output_dir, "summary.json")
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        print(f"  ✓ Summary: {summary_path}")
        
        return {'json': json_path, 'csv': csv_path, 'markdown': md_path, 'summary': summary_path}


def main():
    print("=" * 70)
    print("MASSIVE MCP SERVER SCRAPER")
    print("Target: Get ALL available MCP servers")
    print("=" * 70)
    
    start_time = time.time()
    scraper = MassiveScraper()
    
    # Scrape all sources
    scraper.scrape_glama_unlimited()
    scraper.scrape_official()
    scraper.scrape_npm_deep()
    scraper.scrape_awesome_lists()
    scraper.scrape_github_topics()
    scraper.scrape_smithery()
    scraper.scrape_mcp_so()
    scraper.scrape_pulsemcp()
    
    # Deduplicate
    scraper.deduplicate()
    
    # Save
    outputs = scraper.save_outputs("data_massive")
    
    elapsed = time.time() - start_time
    
    print("\n" + "=" * 70)
    print("COMPLETE")
    print("=" * 70)
    print(f"Total time: {elapsed:.1f}s")
    print(f"Total unique servers: {len(scraper.servers):,}")
    print(f"\nOutput directory: /Users/yoshikondo/mcp-discovery/data_massive/")


if __name__ == "__main__":
    main()
