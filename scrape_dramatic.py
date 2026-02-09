#!/usr/bin/env python3
"""
🚨 DRAMATIC MCP SERVER SCRAPER 🚨
Because finding 5,000+ servers should be EXCITING!
"""

import json
import csv
import requests
import re
import random
from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
import os
import time
import sys

# DRAMATIC MESSAGES
START_MESSAGES = [
    "🔥 INITIATING SERVER HARVEST PROTOCOL 🔥",
    "🚀 BLASTING OFF TO MCP DIMENSION 🚀",
    "⚡ UNLEASHING THE SCRAPING BEAST ⚡",
    "🎯 TARGET: EVERY. SINGLE. SERVER. 🎯",
    "💀 NO SERVER LEFT BEHIND 💀",
]

PROGRESS_EMOJIS = ["🔥", "⚡", "💫", "🚀", "💎", "🔮", "🌟", "✨"]

SUCCESS_MESSAGES = [
    "💰 SERVER ACQUIRED!",
    "🎯 BOOM! GOT ONE!",
    "⚡ SNATCHED!",
    "🔥 YET ANOTHER!",
    "💎 PRECIOUS SERVER FOUND!",
]

COMPLETION_MESSAGES = [
    "🎉 MISSION ACCOMPLISHED! 🎉",
    "🏆 WE DID IT REDDIT! 🏆",
    "🚀 MAXIMUM VELOCITY ACHIEVED! 🚀",
    "💯 ABSOLUTE UNIT COMPLETE! 💯",
    "🔥 LEGENDARY STATUS ACHIEVED! 🔥",
]

@dataclass
class MCPServer:
    name: str
    slug: str
    description: str
    npm_package: Optional[str] = None
    github_url: Optional[str] = None
    install_command: str = ""
    homepage_url: Optional[str] = None
    category: str = "other"
    source: str = ""
    author: Optional[str] = None
    stars: int = 0
    downloads: int = 0

class DramaticScraper:
    def __init__(self):
        self.servers: List[MCPServer] = []
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'MCP-Discovery-Scraper/3.0 (DRAMATIC EDITION)'
        })
        self.stats = {'glama': 0, 'npm': 0, 'awesome': 0, 'official': 0}
        self.start_time = time.time()
        
    def dramatic_print(self, message: str, delay: float = 0.02):
        """Print with dramatic effect"""
        for char in message:
            sys.stdout.write(char)
            sys.stdout.flush()
            time.sleep(delay)
        print()
        
    def print_banner(self):
        """Print the most dramatic banner ever"""
        banner = """
    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║     🔥🔥🔥  MCP SERVER APOCALYPSE  🔥🔥🔥                        ║
    ║                                                                  ║
    ║     We don't just scrape servers...                              ║
    ║     We ABSORB them into the COLLECTIVE 🧠                        ║
    ║                                                                  ║
    ║     Target: 5,000+ Servers | Method: MAXIMUM OVERDRIVE           ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝
        """
        print(banner)
        print(f"\n{random.choice(START_MESSAGES)}\n")
        time.sleep(1)
        
    def map_category(self, categories):
        if not categories:
            return 'other'
        cat = categories[0].lower()
        mapping = {
            'database': 'database', 'search': 'search', 'automation': 'automation',
            'ai': 'ai', 'cloud': 'cloud', 'blockchain': 'blockchain',
            'communication': 'communication', 'productivity': 'productivity',
            'development': 'development', 'security': 'security',
            'scraping': 'scraping', 'finance': 'finance', 'social': 'social',
            'media': 'media', 'design': 'design', '3d': '3d',
            'git': 'development', 'github': 'development', 'code': 'development',
            'llm': 'ai', 'ml': 'ai',
        }
        for key, value in mapping.items():
            if key in cat:
                return value
        return 'other'
    
    def progress_bar(self, current: int, total: int, width: int = 40):
        """Create an EPIC progress bar"""
        filled = int(width * current / total) if total > 0 else 0
        emoji = random.choice(PROGRESS_EMOJIS)
        bar = emoji * filled + "░" * (width - filled)
        percent = (current / total * 100) if total > 0 else 0
        return f"[{bar}] {percent:.1f}% ({current}/{total})"
        
    def scrape_glama_dramatic(self):
        """Scrape Glama with MAXIMUM DRAMA"""
        print("\n🌟 PHASE 1: THE GREAT GLAMA HEIST 🌟")
        print("=" * 60)
        print("💰 Target: https://glama.ai/api/mcp/v1/servers")
        print("🎯 Mission: Extract ALL the servers\n")
        
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
                    print(f"\n💀 GLAMA RESISTED! HTTP {response.status_code}")
                    break
                
                data = response.json()
                servers = data.get('servers', [])
                
                if not servers:
                    print("\n✨ GLAMA IS EMPTY! WE TOOK IT ALL! ✨")
                    break
                
                for s in servers:
                    npm = s.get('npmPackage')
                    repo = s.get('repository')
                    
                    install = f"npx -y {npm}" if npm else ""
                    if not install and s.get('namespace') and s.get('slug'):
                        install = f"npx -y @{s['namespace']}/{s['slug']}"
                    
                    self.servers.append(MCPServer(
                        name=s.get('name', 'Unknown'),
                        slug=s.get('slug') or s.get('name', '').lower().replace(' ', '-'),
                        description=s.get('description', f"MCP server: {s.get('name', '')}"),
                        npm_package=npm,
                        github_url=repo,
                        install_command=install,
                        homepage_url=s.get('homepage'),
                        category=self.map_category(s.get('categories', [])),
                        source='glama',
                        author=s.get('namespace'),
                        stars=s.get('stars', 0),
                        downloads=s.get('downloads', 0)
                    ))
                    count += 1
                
                # DRAMATIC PROGRESS UPDATE
                if page % 10 == 0:
                    elapsed = time.time() - self.start_time
                    rate = count / elapsed if elapsed > 0 else 0
                    print(f"\r🔥 Page {page:3d} | Servers: {count:5d} | Rate: {rate:.1f}/sec", end="", flush=True)
                
                cursor = data.get('pageInfo', {}).get('endCursor')
                has_next = data.get('pageInfo', {}).get('hasNextPage', False)
                
                if not has_next or not cursor:
                    print(f"\n\n🎉 GLAMA CONQUERED! {count} servers in {page} pages!")
                    break
                
                time.sleep(0.1)
                
            except Exception as e:
                print(f"\n💥 GLAMA ERROR: {e}")
                break
        
        self.stats['glama'] = count
        return count
    
    def scrape_npm_dramatic(self):
        """Scrape NPM with STYLE"""
        print("\n📦 PHASE 2: NPM REGISTRY RAID 📦")
        print("=" * 60)
        print("🎯 Target: registry.npmjs.org")
        print("💣 Method: Search EVERYTHING\n")
        
        count = 0
        search_terms = ['mcp-server', 'model-context-protocol', '@modelcontextprotocol']
        all_packages = set()
        
        for term in search_terms:
            print(f"\n  🔍 Searching: '{term}'...", end=" ")
            
            try:
                url = f"https://registry.npmjs.org/-/v1/search?text={term}&size=250"
                response = self.session.get(url, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    found = 0
                    
                    for pkg in data.get('objects', []):
                        p = pkg.get('package', {})
                        name = p.get('name', '')
                        
                        if 'mcp' not in name.lower() or name in all_packages:
                            continue
                        
                        all_packages.add(name)
                        
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
                        found += 1
                    
                    print(f"✅ {found} packages")
                    
            except Exception as e:
                print(f"❌ Error: {e}")
            
            time.sleep(0.3)
        
        print(f"\n🎊 NPM DOMINATED! {count} packages acquired!")
        self.stats['npm'] = count
        return count
    
    def scrape_awesome_dramatic(self):
        """Scrape awesome lists with FLAIR"""
        print("\n⭐ PHASE 3: AWESOME LIST EXTRACTION ⭐")
        print("=" * 60)
        print("📚 Target: punkpeye/wong2 awesome-mcp-servers")
        print("🔪 Method: Parse markdown like a BOSS\n")
        
        awesome_lists = [
            'https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md',
            'https://raw.githubusercontent.com/wong2/awesome-mcp-servers/main/README.md',
        ]
        
        count = 0
        seen_npm = set()
        seen_github = set()
        
        for url in awesome_lists:
            print(f"\n  📖 Reading: {url.split('/')[-4]}...", end=" ")
            
            try:
                response = self.session.get(url, timeout=30)
                if response.status_code == 200:
                    content = response.text
                    
                    # Find npm commands
                    npm_pattern = r'`(npx -y @[\w\-]+/[\w\-]+)`|`(npx -y [\w\-]+)`'
                    npm_matches = re.findall(npm_pattern, content)
                    
                    npm_count = 0
                    for match in npm_matches:
                        cmd = match[0] or match[1]
                        if cmd:
                            pkg = cmd.replace('npx -y ', '')
                            if pkg not in seen_npm:
                                seen_npm.add(pkg)
                                self.servers.append(MCPServer(
                                    name=pkg.split('/')[-1] if '/' in pkg else pkg,
                                    slug=pkg.replace('@', '').replace('/', '-'),
                                    description="MCP server from awesome list",
                                    npm_package=pkg,
                                    install_command=cmd,
                                    source='awesome-list'
                                ))
                                count += 1
                                npm_count += 1
                    
                    # Find GitHub repos
                    github_pattern = r'github\.com/([\w\-]+)/([\w.-]+)'
                    github_matches = re.findall(github_pattern, content)
                    
                    github_count = 0
                    for owner, repo in github_matches:
                        key = f"{owner}/{repo}"
                        if key not in seen_github and 'mcp' in repo.lower():
                            seen_github.add(key)
                            self.servers.append(MCPServer(
                                name=repo,
                                slug=f"{owner}-{repo}".lower(),
                                description="MCP server from awesome list",
                                github_url=f"https://github.com/{owner}/{repo}",
                                source='awesome-list',
                                author=owner
                            ))
                            count += 1
                            github_count += 1
                    
                    print(f"✅ {npm_count} npm + {github_count} github")
                else:
                    print(f"❌ HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Error: {e}")
        
        print(f"\n🌟 AWESOME LISTS MINED! {count} servers extracted!")
        self.stats['awesome'] = count
        return count
    
    def scrape_official_dramatic(self):
        """Scrape official registry with RESPECT"""
        print("\n👑 PHASE 4: OFFICIAL REGISTRY (The OG) 👑")
        print("=" * 60)
        print("🏛️ Target: registry.modelcontextprotocol.io")
        print("🎩 Method: Respectful API calls\n")
        
        count = 0
        cursor = None
        
        while True:
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
                    
                    install = f"npx -y {pkg['name']}" if pkg.get('name') else ""
                    
                    self.servers.append(MCPServer(
                        name=s.get('display_name') or s.get('name', 'Unknown'),
                        slug=s.get('slug', ''),
                        description=s.get('description', ''),
                        npm_package=pkg.get('name'),
                        github_url=repo.get('url'),
                        install_command=install,
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
                break
        
        print(f"✅ Official Registry: {count} servers (verified!)")
        self.stats['official'] = count
        return count
    
    def deduplicate_dramatic(self):
        """Deduplicate with CEREMONY"""
        print("\n🧹 PHASE 5: THE GREAT PURGE (Deduplication) 🧹")
        print("=" * 60)
        print("🗑️ Removing duplicates like a data janitor\n")
        
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
        removed = before - after
        
        print(f"  📊 Before: {before:,} servers")
        print(f"  ✨ After:  {after:,} servers")
        print(f"  🗑️  Purged: {removed:,} duplicates ({removed/before*100:.1f}%)")
        print("\n🎊 DEDUPLICATION COMPLETE! Only unique gems remain!")
        
        return after
    
    def save_outputs_dramatic(self):
        """Save with CELEBRATION"""
        print("\n💾 PHASE 6: PRESERVING THE TREASURE 💾")
        print("=" * 60)
        
        os.makedirs("data", exist_ok=True)
        
        # JSON
        print("  📄 Writing JSON...", end=" ")
        json_path = "data/mcp_servers_complete.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump([asdict(s) for s in self.servers], f, indent=2, ensure_ascii=False)
        print(f"✅ {len(self.servers):,} servers")
        
        # CSV
        print("  📊 Writing CSV...", end=" ")
        csv_path = "data/mcp_servers_complete.csv"
        with open(csv_path, 'w', encoding='utf-8', newline='') as f:
            if self.servers:
                writer = csv.DictWriter(f, fieldnames=asdict(self.servers[0]).keys())
                writer.writeheader()
                for server in self.servers:
                    writer.writerow(asdict(server))
        print("✅ Done!")
        
        # Markdown
        print("  📝 Writing Markdown...", end=" ")
        md_path = "data/MCP_SERVERS_COMPLETE.md"
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write("# 🔥 MCP Servers Database - COMPLETE 🔥\n\n")
            f.write(f"**Total Servers:** {len(self.servers):,} 🚀\n\n")
            f.write(f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## 📊 Sources\n\n")
            for source, count in sorted(self.stats.items(), key=lambda x: -x[1]):
                if count > 0:
                    emoji = "💎" if count > 1000 else "⭐" if count > 100 else "🔹"
                    f.write(f"{emoji} **{source.capitalize()}:** {count:,} servers\n")
            f.write(f"\n🎯 **Total Unique:** {len(self.servers):,} servers\n\n")
            
            # Categories
            categories = {}
            for s in self.servers:
                cat = s.category or 'other'
                categories[cat] = categories.get(cat, 0) + 1
            
            f.write("## 🏷️ Categories\n\n")
            for cat, count in sorted(categories.items(), key=lambda x: -x[1])[:15]:
                emoji = {"database": "🗄️", "development": "💻", "ai": "🤖", 
                        "communication": "💬", "cloud": "☁️", "other": "📦"}.get(cat, "🔹")
                f.write(f"{emoji} **{cat.capitalize()}:** {count:,}\n")
            f.write("\n")
            
            # Top 50
            f.write("## 🏆 Top 50 Servers\n\n")
            top = sorted(self.servers, key=lambda x: x.stars, reverse=True)[:50]
            for i, s in enumerate(top, 1):
                medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else "🔹"
                f.write(f"{medal} **{s.name}** (⭐ {s.stars:,})\n")
                f.write(f"   {s.description[:120]}{'...' if len(s.description) > 120 else ''}\n")
                if s.npm_package:
                    f.write(f"   💾 `{s.install_command}`\n")
                if s.github_url:
                    f.write(f"   🔗 {s.github_url}\n")
                f.write("\n")
        print("✅ Done!")
        
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
        
        with open("data/summary.json", 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n💾 ALL DATA SAVED!")
        return {'json': json_path, 'csv': csv_path, 'markdown': md_path}
    
    def run(self):
        """RUN EVERYTHING WITH MAXIMUM DRAMA"""
        self.print_banner()
        
        # PHASES
        self.scrape_glama_dramatic()
        self.scrape_npm_dramatic()
        self.scrape_awesome_dramatic()
        self.scrape_official_dramatic()
        self.deduplicate_dramatic()
        outputs = self.save_outputs_dramatic()
        
        # GRAND FINALE
        elapsed = time.time() - self.start_time
        
        print("\n" + "=" * 70)
        print(random.choice(COMPLETION_MESSAGES))
        print("=" * 70)
        print(f"\n⏱️  Time elapsed: {elapsed:.1f} seconds")
        print(f"🎯 Total servers: {len(self.servers):,}")
        print(f"⚡ Average rate: {len(self.servers)/elapsed:.1f} servers/second")
        
        print(f"\n📁 Output files:")
        print(f"   📄 JSON: {outputs['json']}")
        print(f"   📊 CSV:  {outputs['csv']}")
        print(f"   📝 MD:   {outputs['markdown']}")
        
        print("\n" + "🎊" * 35)
        print("\n   THE MCP DISCOVERY DATABASE IS NOW")
        print(f"   *** POPULATED WITH {len(self.servers):,} SERVERS ***")
        print("\n" + "🎊" * 35 + "\n")


if __name__ == "__main__":
    scraper = DramaticScraper()
    scraper.run()
