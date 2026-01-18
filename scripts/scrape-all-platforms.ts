#!/usr/bin/env tsx

/**
 * Multi-Platform MCP Server Scraper
 * Scrapes from: Glama, Smithery, mcp.so, PulseMCP, NPM, PyPI, GitHub
 * Uses DeepSeek API for intelligent extraction
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// DeepSeek API client
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
interface RawServer {
  name: string;
  author?: string;
  description?: string;
  url?: string;
  github_url?: string;
  npm_package?: string;
  pypi_package?: string;
  source: string;
}

interface EnrichedServer {
  name: string;
  slug: string;
  npm_package: string | null;
  pypi_package: string | null;
  github_url: string | null;
  description: string;
  install_command: string;
  docs_url: string | null;
  homepage_url: string | null;
  category: string;
  capabilities: string[];
  source: string;
}

// Progress tracking
const progress = {
  glama: { found: 0, pages: 0 },
  smithery: { found: 0, pages: 0 },
  mcpso: { found: 0, pages: 0 },
  pulsemcp: { found: 0, pages: 0 },
  npm: { found: 0, pages: 0 },
  pypi: { found: 0, pages: 0 },
  github: { found: 0, pages: 0 },
  official: { found: 0, pages: 0 },
  enriched: 0,
  inserted: 0,
  errors: 0,
};

function printProgress() {
  console.log('\n' + '='.repeat(60));
  console.log('SCRAPING PROGRESS');
  console.log('='.repeat(60));
  console.log(`Glama.ai:     ${progress.glama.found} servers (${progress.glama.pages} pages)`);
  console.log(`Smithery.ai:  ${progress.smithery.found} servers (${progress.smithery.pages} pages)`);
  console.log(`mcp.so:       ${progress.mcpso.found} servers (${progress.mcpso.pages} pages)`);
  console.log(`PulseMCP:     ${progress.pulsemcp.found} servers (${progress.pulsemcp.pages} pages)`);
  console.log(`NPM:          ${progress.npm.found} packages`);
  console.log(`PyPI:         ${progress.pypi.found} packages`);
  console.log(`GitHub:       ${progress.github.found} repos`);
  console.log(`Official:     ${progress.official.found} servers`);
  console.log('-'.repeat(60));
  const total = Object.values(progress).reduce((sum, p) =>
    typeof p === 'object' ? sum + p.found : sum, 0);
  console.log(`TOTAL RAW:    ${total} servers`);
  console.log(`Enriched:     ${progress.enriched}`);
  console.log(`Inserted:     ${progress.inserted}`);
  console.log(`Errors:       ${progress.errors}`);
  console.log('='.repeat(60) + '\n');
}

// Utilities
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<string> {
  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) MCP-Discovery-Bot/1.0',
    'Accept': 'text/html,application/json,*/*',
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      console.log(`  Retry ${i + 1}/${retries} for ${url}`);
      await sleep(2000 * (i + 1));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

// DeepSeek extraction prompt
const EXTRACTION_PROMPT = `Extract MCP (Model Context Protocol) servers from this content.
Return a JSON array of servers with these fields:
- name: Server name
- author: Author/organization
- description: Brief description
- url: Homepage or registry URL
- github_url: GitHub URL if present
- npm_package: NPM package name if present
- pypi_package: PyPI package name if present

Extract ALL servers you can find. Return valid JSON array only, no other text.

Content:
`;

const ENRICHMENT_PROMPT = `You are structuring MCP server data for a discovery service.

Given this raw server data, return a JSON object with:
- name: Clean display name (e.g., "Notion MCP Server")
- slug: URL-friendly ID (e.g., "notion-mcp-server")
- npm_package: NPM package name or null
- pypi_package: PyPI package name or null
- github_url: Full GitHub URL or null
- description: 2-3 sentences optimized for semantic search, include key features and use cases
- install_command: Installation command (npx -y @package/name OR uvx package-name OR pip install package)
- docs_url: Documentation URL or null
- homepage_url: Project homepage or null
- category: One of: database, search, automation, ai, cloud, blockchain, communication, productivity, development, security, monitoring, scraping, research, finance, social, media, content, translation, fitness, design, 3d, other
- capabilities: Array of 3-6 relevant tags (lowercase, hyphenated)

Return valid JSON object only.

Raw data:
`;

async function extractWithDeepSeek(content: string): Promise<RawServer[]> {
  try {
    const truncated = content.slice(0, 25000);
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You extract structured data. Always return valid JSON arrays.' },
        { role: 'user', content: EXTRACTION_PROMPT + truncated },
      ],
      temperature: 0.1,
      max_tokens: 8000,
    });

    const text = response.choices[0]?.message?.content || '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('DeepSeek extraction error:', error);
    progress.errors++;
    return [];
  }
}

async function enrichWithDeepSeek(raw: RawServer): Promise<EnrichedServer | null> {
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You structure MCP server data. Return valid JSON objects only.' },
        { role: 'user', content: ENRICHMENT_PROMPT + JSON.stringify(raw, null, 2) },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const text = response.choices[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, source: raw.source };
  } catch (error) {
    console.error(`Enrichment error for ${raw.name}:`, error);
    progress.errors++;
    return null;
  }
}

// ============== PLATFORM SCRAPERS ==============

// 1. Glama.ai
async function scrapeGlama(maxPages = 50): Promise<RawServer[]> {
  console.log('\n[1/8] Scraping Glama.ai...');
  const servers: RawServer[] = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      console.log(`  Page ${page}/${maxPages}...`);
      const html = await fetchWithRetry(`https://glama.ai/mcp/servers?page=${page}`);
      const extracted = await extractWithDeepSeek(html);

      if (extracted.length === 0) {
        console.log(`  No more servers found, stopping.`);
        break;
      }

      extracted.forEach(s => { s.source = 'glama'; });
      servers.push(...extracted);
      progress.glama.found = servers.length;
      progress.glama.pages = page;

      console.log(`  Found ${extracted.length} servers (total: ${servers.length})`);
      await sleep(1500);
    } catch (error) {
      console.error(`  Error on page ${page}:`, error);
      progress.errors++;
    }
  }

  return servers;
}

// 2. Smithery.ai
async function scrapeSmithery(maxPages = 20): Promise<RawServer[]> {
  console.log('\n[2/8] Scraping Smithery.ai...');
  const servers: RawServer[] = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      console.log(`  Page ${page}/${maxPages}...`);
      const html = await fetchWithRetry(`https://smithery.ai/servers?page=${page}`);
      const extracted = await extractWithDeepSeek(html);

      if (extracted.length === 0) break;

      extracted.forEach(s => { s.source = 'smithery'; });
      servers.push(...extracted);
      progress.smithery.found = servers.length;
      progress.smithery.pages = page;

      console.log(`  Found ${extracted.length} servers (total: ${servers.length})`);
      await sleep(1500);
    } catch (error) {
      console.error(`  Error on page ${page}:`, error);
      progress.errors++;
    }
  }

  return servers;
}

// 3. mcp.so
async function scrapeMcpSo(maxPages = 20): Promise<RawServer[]> {
  console.log('\n[3/8] Scraping mcp.so...');
  const servers: RawServer[] = [];

  try {
    // Try main page first
    const html = await fetchWithRetry('https://mcp.so/servers');
    const extracted = await extractWithDeepSeek(html);
    extracted.forEach(s => { s.source = 'mcpso'; });
    servers.push(...extracted);
    progress.mcpso.found = servers.length;
    progress.mcpso.pages = 1;
    console.log(`  Found ${extracted.length} servers`);
  } catch (error) {
    console.log('  mcp.so not accessible or different structure');
    progress.errors++;
  }

  return servers;
}

// 4. PulseMCP
async function scrapePulseMcp(): Promise<RawServer[]> {
  console.log('\n[4/8] Scraping PulseMCP...');
  const servers: RawServer[] = [];

  try {
    const html = await fetchWithRetry('https://www.pulsemcp.com/servers');
    const extracted = await extractWithDeepSeek(html);
    extracted.forEach(s => { s.source = 'pulsemcp'; });
    servers.push(...extracted);
    progress.pulsemcp.found = servers.length;
    progress.pulsemcp.pages = 1;
    console.log(`  Found ${extracted.length} servers`);
  } catch (error) {
    console.log('  PulseMCP not accessible');
    progress.errors++;
  }

  return servers;
}

// 5. NPM Registry
async function scrapeNpm(maxPages = 10): Promise<RawServer[]> {
  console.log('\n[5/8] Scraping NPM for MCP packages...');
  const servers: RawServer[] = [];
  const searchTerms = ['mcp-server', 'mcp server', 'model-context-protocol', '@modelcontextprotocol'];

  for (const term of searchTerms) {
    try {
      console.log(`  Searching: "${term}"...`);
      const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(term)}&size=250`;
      const response = await fetchWithRetry(url);
      const data = JSON.parse(response);

      for (const pkg of data.objects || []) {
        const p = pkg.package;
        servers.push({
          name: p.name,
          author: p.author?.name || p.publisher?.username,
          description: p.description,
          url: `https://www.npmjs.com/package/${p.name}`,
          npm_package: p.name,
          github_url: p.links?.repository,
          source: 'npm',
        });
      }

      progress.npm.found = servers.length;
      console.log(`  Found ${data.objects?.length || 0} packages`);
      await sleep(500);
    } catch (error) {
      console.error(`  Error searching NPM:`, error);
      progress.errors++;
    }
  }

  return servers;
}

// 6. PyPI
async function scrapePypi(): Promise<RawServer[]> {
  console.log('\n[6/8] Scraping PyPI for MCP packages...');
  const servers: RawServer[] = [];
  const searchTerms = ['mcp-server', 'mcp_server', 'model-context-protocol'];

  for (const term of searchTerms) {
    try {
      console.log(`  Searching: "${term}"...`);
      // PyPI simple search via warehouse API
      const url = `https://pypi.org/search/?q=${encodeURIComponent(term)}&o=`;
      const html = await fetchWithRetry(url);
      const extracted = await extractWithDeepSeek(html);

      extracted.forEach(s => {
        s.source = 'pypi';
        if (s.name && !s.pypi_package) {
          s.pypi_package = s.name.toLowerCase().replace(/\s+/g, '-');
        }
      });
      servers.push(...extracted);

      console.log(`  Found ${extracted.length} packages`);
      await sleep(1000);
    } catch (error) {
      console.error(`  Error searching PyPI:`, error);
      progress.errors++;
    }
  }

  progress.pypi.found = servers.length;
  return servers;
}

// 7. GitHub
async function scrapeGitHub(): Promise<RawServer[]> {
  console.log('\n[7/8] Scraping GitHub for MCP repos...');
  const servers: RawServer[] = [];
  const searchTerms = ['mcp-server', 'model-context-protocol server', 'topic:mcp'];

  for (const term of searchTerms) {
    try {
      console.log(`  Searching: "${term}"...`);
      // Use GitHub search HTML (no API key needed)
      const url = `https://github.com/search?q=${encodeURIComponent(term)}&type=repositories`;
      const html = await fetchWithRetry(url);
      const extracted = await extractWithDeepSeek(html);

      extracted.forEach(s => { s.source = 'github'; });
      servers.push(...extracted);

      console.log(`  Found ${extracted.length} repos`);
      await sleep(2000); // GitHub rate limits aggressively
    } catch (error) {
      console.error(`  Error searching GitHub:`, error);
      progress.errors++;
    }
  }

  // Also scrape awesome-mcp lists
  console.log('  Scraping awesome-mcp lists...');
  const awesomeLists = [
    'https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md',
    'https://raw.githubusercontent.com/wong2/awesome-mcp-servers/main/README.md',
  ];

  for (const url of awesomeLists) {
    try {
      const content = await fetchWithRetry(url);
      const extracted = await extractWithDeepSeek(content);
      extracted.forEach(s => { s.source = 'github'; });
      servers.push(...extracted);
      console.log(`  Found ${extracted.length} from awesome list`);
      await sleep(500);
    } catch (error) {
      console.log(`  Skipped: ${url}`);
    }
  }

  progress.github.found = servers.length;
  return servers;
}

// 8. Official MCP Registry
async function scrapeOfficialRegistry(): Promise<RawServer[]> {
  console.log('\n[8/8] Scraping Official MCP Registry...');
  const servers: RawServer[] = [];

  try {
    let cursor: string | null = null;
    let pageNum = 0;

    while (pageNum < 50) {
      pageNum++;
      const url = cursor
        ? `https://registry.modelcontextprotocol.io/v0.1/servers?cursor=${cursor}`
        : 'https://registry.modelcontextprotocol.io/v0.1/servers';

      console.log(`  Page ${pageNum}...`);
      const response = await fetch(url);
      const data = await response.json();

      if (!data.servers || data.servers.length === 0) break;

      for (const server of data.servers) {
        servers.push({
          name: server.name || server.display_name,
          author: server.author || 'unknown',
          description: server.description || '',
          url: server.homepage,
          github_url: server.repository?.url,
          npm_package: server.package?.name,
          source: 'official',
        });
      }

      progress.official.found = servers.length;
      progress.official.pages = pageNum;
      console.log(`  Found ${data.servers.length} servers`);

      cursor = data.next_cursor;
      if (!cursor) break;
      await sleep(500);
    }
  } catch (error) {
    console.error('  Official registry error:', error);
    progress.errors++;
  }

  return servers;
}

// Deduplicate by slug
function deduplicateServers(servers: EnrichedServer[]): EnrichedServer[] {
  const seen = new Set<string>();
  return servers.filter(server => {
    const key = server.slug || server.name.toLowerCase().replace(/\s+/g, '-');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Insert into Supabase
async function insertServers(servers: EnrichedServer[]): Promise<number> {
  let inserted = 0;

  for (const server of servers) {
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('mcp_servers')
        .select('id')
        .eq('slug', server.slug)
        .single();

      if (existing) continue;

      // Insert
      const { error } = await supabase
        .from('mcp_servers')
        .insert({
          name: server.name,
          slug: server.slug,
          npm_package: server.npm_package,
          github_url: server.github_url,
          description: server.description,
          install_command: server.install_command,
          docs_url: server.docs_url,
          homepage_url: server.homepage_url,
          category: server.category,
          is_verified: false,
        });

      if (error) {
        console.error(`  Insert error for ${server.name}:`, error.message);
        progress.errors++;
        continue;
      }

      inserted++;
      progress.inserted = inserted;

      if (inserted % 50 === 0) {
        console.log(`  Inserted ${inserted} servers...`);
      }
    } catch (error) {
      progress.errors++;
    }
  }

  return inserted;
}

// Main
async function main() {
  console.log('='.repeat(60));
  console.log('MULTI-PLATFORM MCP SERVER SCRAPER');
  console.log('Using DeepSeek API for intelligent extraction');
  console.log('='.repeat(60));

  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('ERROR: DEEPSEEK_API_KEY not set');
    process.exit(1);
  }

  // Collect from all sources
  const allRaw: RawServer[] = [];

  // Run scrapers
  const glamaServers = await scrapeGlama(30);
  allRaw.push(...glamaServers);
  printProgress();

  const smitheryServers = await scrapeSmithery(15);
  allRaw.push(...smitheryServers);
  printProgress();

  const mcpsoServers = await scrapeMcpSo();
  allRaw.push(...mcpsoServers);

  const pulsemcpServers = await scrapePulseMcp();
  allRaw.push(...pulsemcpServers);

  const npmServers = await scrapeNpm();
  allRaw.push(...npmServers);
  printProgress();

  const pypiServers = await scrapePypi();
  allRaw.push(...pypiServers);

  const githubServers = await scrapeGitHub();
  allRaw.push(...githubServers);
  printProgress();

  const officialServers = await scrapeOfficialRegistry();
  allRaw.push(...officialServers);
  printProgress();

  // Enrich with DeepSeek
  console.log('\n=== Enriching servers with DeepSeek ===');
  const enriched: EnrichedServer[] = [];

  for (let i = 0; i < allRaw.length; i++) {
    const raw = allRaw[i];
    process.stdout.write(`\r  [${i + 1}/${allRaw.length}] Enriching: ${raw.name?.slice(0, 40)}...`);

    const server = await enrichWithDeepSeek(raw);
    if (server) {
      enriched.push(server);
      progress.enriched = enriched.length;
    }

    // Rate limit
    if (i % 10 === 0) await sleep(300);

    // Progress update
    if ((i + 1) % 100 === 0) {
      console.log('');
      printProgress();
    }
  }

  // Deduplicate
  console.log('\n=== Deduplicating ===');
  const unique = deduplicateServers(enriched);
  console.log(`Unique servers: ${unique.length}`);

  // Insert
  console.log('\n=== Inserting into Supabase ===');
  const inserted = await insertServers(unique);

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('SCRAPING COMPLETE');
  console.log('='.repeat(60));
  printProgress();
  console.log(`Final unique: ${unique.length}`);
  console.log(`Final inserted: ${inserted}`);
}

main().catch(console.error);
