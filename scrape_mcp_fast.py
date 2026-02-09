#!/usr/bin/env python3
"""
Fast MCP Server Scraper - Optimized for speed
"""

import json
import csv
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

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
    
    def __post_init__(self):
        if not self.slug:
            self.slug = self.name.lower().replace(' ', '-').replace('_', '-')
        if not self.description:
            self.description = f"MCP server: {self.name}"

class MCPServerScraper:
    def __init__(self):
        self.servers: List[MCPServer] = []
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'MCP-Discovery-Scraper/2.0'})
        self.stats = {'glama': 0, 'smithery': 0, 'official': 0, 'npm': 0, 'github': 0, 'awesome': 0}
        
    def map_category(self, categories: Optional[List[str]]) -> str:
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
    
    def generate_install_command(self, server: Dict) -> str:
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
    
    def scrape_glama(self) -> int:
        """Scrape from Glama.ai API"""
        print("[1/6] Scraping Glama.ai API...")
        count = 0
        cursor = None
        
        for page in range(1, 400):
            try:
                url = "https://glama.ai/api/mcp/v1/servers?limit=100"
                if cursor:
                    url += f"&after={cursor}"
                
                response = self.session.get(url, timeout=30)
                if response.status_code != 200:
                    print(f"  HTTP {response.status_code}")
                    break
                
                data = response.json()
                if not data.get('servers'):
                    break
                
                for s in data['servers']:
                    self.servers.append(MCPServer(
                        name=s.get('name', 'Unknown'),
                        slug=s.get('slug', ''),
                        description=s.get('description', f"MCP server: {s.get('name', '')}"),
                        npm_package=s.get('npmPackage'),
                        github_url=s.get('repository'),
                        install_command=self.generate_install_command(s),
                        homepage_url=s.get('homepage'),
                        category=self.map_category(s.get('categories', [])),
                        source='glama',
                        author=s.get('namespace'),
                        stars=s.get('stars', 0),
                        downloads=s.get('downloads', 0)
                    ))
                    count += 1
                
                cursor = data.get('pageInfo', {}).get('endCursor')
                has_next = data.get('pageInfo', {}).get('hasNextPage', False)
                
                if page % 10 == 0:
                    print(f"  Page {page}: {count} servers")
                
                if not has_next or not cursor:
                    break
                    
                time.sleep(0.1)
                
            except Exception as e:
                print(f"  Error on page {page}: {e}")
                break
        
        self.stats['glama'] = count
        print(f"  ✓ Glama.ai: {count} servers")
        return count
    
    def scrape_official_registry(self) -> int:
        """Scrape from official MCP registry"""
        print("\n[2/6] Scraping Official MCP Registry...")
        count = 0
        cursor = None
        
        for _ in range(100):
            try:
                url = "https://registry.modelcontextprotocol.io/v0.1/servers"
                if cursor:
                    url += f"?cursor={cursor}"
                
                response = self.session.get(url, timeout=30)
                if response.status_code != 200:
                    break
                
                data = response.json()
                if not data.get('servers'):
                    break
                
                for s in data['servers']:
                    self.servers.append(MCPServer(
                        name=s.get('name') or s.get('display_name', 'Unknown'),
                        slug=s.get('slug', ''),
                        description=s.get('description', ''),
                        npm_package=s.get('package', {}).get('name') if s.get('package') else None,
                        github_url=s.get('repository', {}).get('url') if s.get('repository') else None,
                        install_command=self.generate_install_command(s),
                        homepage_url=s.get('homepage'),
                        category=self.map_category(s.get('categories', [])),
                        source='official',
                        author=s.get('author')
                    ))
                    count += 1
                
                cursor = data.get('next_cursor')
                if not cursor:
                    break
                    
                time.sleep(0.2)
                
            except Exception as e:
                print(f"  Error: {e}")
                break
        
        self.stats['official'] = count
        print(f"  ✓ Official Registry: {count} servers")
        return count
    
    def scrape_npm(self) -> int:
        """Scrape NPM registry"""
        print("\n[3/6] Scraping NPM Registry...")
        count = 0
        
        search_terms = ['mcp-server', 'model-context-protocol', '@modelcontextprotocol']
        
        for term in search_terms:
            try:
                url = f"https://registry.npmjs.org/-/v1/search?text={term}&size=250"
                response = self.session.get(url, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    for pkg in data.get('objects', []):
                        p = pkg.get('package', {})
                        name = p.get('name', '')
                        
                        if 'mcp' not in name.lower():
                            continue
                        
                        self.servers.append(MCPServer(
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
                    
                    print(f"  Term '{term}': {len(data.get('objects', []))} packages")
                    
            except Exception as e:
                print(f"  Error for '{term}': {e}")
            
            time.sleep(0.3)
        
        self.stats['npm'] = count
        print(f"  ✓ NPM: {count} packages")
        return count
    
    def scrape_awesome_lists(self) -> int:
        """Scrape awesome MCP lists"""
        print("\n[4/6] Scraping awesome-mcp lists...")
        count = 0
        
        awesome_lists = [
            'https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md',
            'https://raw.githubusercontent.com/wong2/awesome-mcp-servers/main/README.md'
        ]
        
        for url in awesome_lists:
            try:
                response = self.session.get(url, timeout=30)
                if response.status_code == 200:
                    content = response.text
                    
                    # Find npx commands
                    import re
                    npm_pattern = r'`(npx -y @[\w-]+/[\w-]+)`|`(npx -y [\w-]+)`'
                    npm_matches = re.findall(npm_pattern, content)
                    
                    for match in npm_matches:
                        cmd = match[0] or match[1]
                        if cmd:
                            pkg = cmd.replace('npx -y ', '')
                            self.servers.append(MCPServer(
                                name=pkg.split('/')[-1] if '/' in pkg else pkg,
                                slug=pkg.replace('@', '').replace('/', '-'),
                                description="MCP server from awesome list",
                                npm_package=pkg,
                                install_command=cmd,
                                source='awesome-list'
                            ))
                            count += 1
                    
                    # Find GitHub repos
                    github_pattern = r'github\.com/([\w-]+)/([\w.-]+)'
                    github_matches = re.findall(github_pattern, content)
                    
                    for owner, repo in github_matches:
                        if 'mcp' in repo.lower():
                            self.servers.append(MCPServer(
                                name=repo,
                                slug=f"{owner}-{repo}".lower(),
                                description="MCP server from awesome list",
                                github_url=f"https://github.com/{owner}/{repo}",
                                source='awesome-list',
                                author=owner
                            ))
                            count += 1
                            
            except Exception as e:
                print(f"  Error: {e}")
        
        self.stats['awesome'] = count
        print(f"  ✓ Awesome lists: {count} servers")
        return count
    
    def scrape_smithery(self) -> int:
        """Scrape from Smithery.ai"""
        print("\n[5/6] Scraping Smithery.ai...")
        count = 0
        
        for page in range(1, 30):
            try:
                url = f"https://smithery.ai/api/servers?page={page}&limit=100"
                response = self.session.get(url, timeout=30)
                
                if response.status_code != 200:
                    break
                
                data = response.json()
                if not data.get('servers'):
                    break
                
                for s in data['servers']:
                    self.servers.append(MCPServer(
                        name=s.get('name', 'Unknown'),
                        slug=s.get('slug', ''),
                        description=s.get('description', ''),
                        npm_package=s.get('npmPackage'),
                        github_url=s.get('repository'),
                        install_command=self.generate_install_command(s),
                        homepage_url=s.get('homepage'),
                        category=self.map_category(s.get('categories', [])),
                        source='smithery',
                        author=s.get('author'),
                        stars=s.get('stars', 0)
                    ))
                    count += 1
                
                if len(data['servers']) < 100:
                    break
                    
                time.sleep(0.2)
                
            except Exception as e:
                break
        
        self.stats['smithery'] = count
        print(f"  ✓ Smithery.ai: {count} servers")
        return count
    
    def deduplicate(self) -> int:
        """Remove duplicates"""
        print("\n[6/6] Deduplicating...")
        
        seen = {}
        unique = []
        
        for server in self.servers:
            key = None
            if server.npm_package and isinstance(server.npm_package, str):
                key = f"npm:{server.npm_package.lower()}"
            elif server.github_url and isinstance(server.github_url, str):
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
        
        print(f"  ✓ {before} → {after} (removed {before - after})")
        return after
    
    def save_outputs(self, output_dir: str = "data"):
        """Save all output files"""
        print("\n" + "="*70)
        print("SAVING OUTPUTS")
        print("="*70)
        
        os.makedirs(output_dir, exist_ok=True)
        
        # JSON
        json_path = os.path.join(output_dir, "mcp_servers_complete.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump([asdict(s) for s in self.servers], f, indent=2, ensure_ascii=False)
        print(f"  ✓ JSON: {json_path}")
        
        # CSV
        csv_path = os.path.join(output_dir, "mcp_servers_complete.csv")
        with open(csv_path, 'w', encoding='utf-8', newline='') as f:
            if self.servers:
                writer = csv.DictWriter(f, fieldnames=asdict(self.servers[0]).keys())
                writer.writeheader()
                for server in self.servers:
                    writer.writerow(asdict(server))
        print(f"  ✓ CSV: {csv_path}")
        
        # Markdown
        md_path = os.path.join(output_dir, "MCP_SERVERS_COMPLETE.md")
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write("# MCP Servers Database\n\n")
            f.write(f"**Total Servers:** {len(self.servers):,}\n\n")
            f.write(f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## Sources\n\n")
            for source, count in self.stats.items():
                if count > 0:
                    f.write(f"- **{source.capitalize()}:** {count:,}\n")
            f.write(f"- **Total Unique:** {len(self.servers):,}\n\n")
            
            # Categories
            categories = {}
            for s in self.servers:
                cat = s.category or 'other'
                categories[cat] = categories.get(cat, 0) + 1
            
            f.write("## Categories\n\n")
            for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
                f.write(f"- **{cat.capitalize()}:** {count:,}\n")
            f.write("\n")
            
            # Top 100
            f.write("## Top 100 Servers by Stars\n\n")
            top = sorted(self.servers, key=lambda x: x.stars, reverse=True)[:100]
            for i, s in enumerate(top, 1):
                f.write(f"{i}. **{s.name}** (⭐ {s.stars:,})\n")
                f.write(f"   - {s.description[:120]}{'...' if len(s.description) > 120 else ''}\n")
                if s.npm_package:
                    f.write(f"   - Install: `{s.install_command}`\n")
                if s.github_url:
                    f.write(f"   - [GitHub]({s.github_url})\n")
                f.write("\n")
        
        print(f"  ✓ Markdown: {md_path}")
        
        # Summary
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
    print("FAST MCP SERVER SCRAPER")
    print("=" * 70)
    
    start_time = time.time()
    scraper = MCPServerScraper()
    
    # Scrape all sources
    scraper.scrape_glama()
    scraper.scrape_official_registry()
    scraper.scrape_npm()
    scraper.scrape_awesome_lists()
    scraper.scrape_smithery()
    scraper.deduplicate()
    
    # Save
    outputs = scraper.save_outputs("data")
    
    elapsed = time.time() - start_time
    
    print("\n" + "=" * 70)
    print("COMPLETE")
    print("=" * 70)
    print(f"Total time: {elapsed:.1f}s")
    print(f"Total unique servers: {len(scraper.servers):,}")
    print(f"\nOutputs in: /Users/yoshikondo/mcp-discovery/data/")


if __name__ == "__main__":
    main()
