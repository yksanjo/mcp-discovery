#!/usr/bin/env tsx

/**
 * MCP Server Scraper using DeepSeek API
 * Scrapes servers from Glama.ai and other registries
 * Target: 10,000+ servers
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// DeepSeek API client (OpenAI-compatible)
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
interface ScrapedServer {
  name: string;
  slug: string;
  npm_package: string | null;
  github_url: string | null;
  description: string;
  install_command: string;
  docs_url: string | null;
  homepage_url: string | null;
  category: string;
  capabilities: string[];
}

interface GlamaServer {
  name: string;
  author: string;
  description: string;
  categories: string[];
  github_url?: string;
  npm_package?: string;
  license?: string;
}

// DeepSeek prompt for extracting and enriching server data
const EXTRACTION_PROMPT = `You are an expert at extracting and structuring MCP (Model Context Protocol) server information.

Given raw server data, extract and return a JSON object with these fields:
- name: Clean server name (e.g., "Notion MCP Server")
- slug: URL-friendly identifier (e.g., "notion-mcp-server")
- npm_package: NPM package name if available, null otherwise
- github_url: Full GitHub URL if available
- description: 2-3 sentence description optimized for semantic search. Include key features and use cases.
- install_command: The npx/uvx command to install (e.g., "npx -y @package/name" or "uvx package-name")
- docs_url: Documentation URL if available
- homepage_url: Project homepage URL
- category: One of: database, search, automation, ai, cloud, blockchain, communication, productivity, development, security, monitoring, scraping, research, finance, social, media, content, translation, fitness, design, 3d
- capabilities: Array of 3-6 relevant capability tags (lowercase, hyphenated)

IMPORTANT:
- Make descriptions rich and detailed for better semantic search
- Infer install_command from npm_package or github patterns
- Always return valid JSON

Raw server data:
`;

const BATCH_EXTRACTION_PROMPT = `You are extracting MCP server information from a webpage listing.

Parse the following HTML/text content and extract ALL MCP servers mentioned.
Return a JSON array of servers, each with:
- name: Server name
- author: Author/organization
- description: Brief description
- categories: Array of category strings
- github_url: GitHub URL if present
- npm_package: NPM package if present

Extract as many servers as you can find. Return valid JSON array only.

Content to parse:
`;

// Fetch with retry
async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) MCP-Discovery-Bot/1.0',
          'Accept': 'text/html,application/json',
        },
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

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Use DeepSeek to extract servers from raw HTML/text
async function extractServersWithDeepSeek(content: string): Promise<GlamaServer[]> {
  try {
    // Truncate content if too long
    const truncated = content.slice(0, 30000);

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You extract structured data from web content. Always return valid JSON arrays.',
        },
        {
          role: 'user',
          content: BATCH_EXTRACTION_PROMPT + truncated,
        },
      ],
      temperature: 0.1,
      max_tokens: 8000,
    });

    const text = response.choices[0]?.message?.content || '[]';
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('DeepSeek extraction error:', error);
    return [];
  }
}

// Enrich a single server with DeepSeek
async function enrichServerWithDeepSeek(raw: GlamaServer): Promise<ScrapedServer | null> {
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You structure MCP server data. Always return valid JSON objects.',
        },
        {
          role: 'user',
          content: EXTRACTION_PROMPT + JSON.stringify(raw, null, 2),
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const text = response.choices[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error(`Failed to enrich ${raw.name}:`, error);
    return null;
  }
}

// Scrape Glama.ai pages
async function scrapeGlama(maxPages = 200): Promise<GlamaServer[]> {
  console.log('\n=== Scraping Glama.ai ===');
  const allServers: GlamaServer[] = [];

  for (let page = 1; page <= maxPages; page++) {
    console.log(`Fetching page ${page}/${maxPages}...`);

    try {
      // Glama uses a different pagination approach
      const url = `https://glama.ai/mcp/servers?page=${page}`;
      const html = await fetchWithRetry(url);

      // Extract servers using DeepSeek
      const servers = await extractServersWithDeepSeek(html);

      if (servers.length === 0) {
        console.log(`  No servers found on page ${page}, stopping.`);
        break;
      }

      console.log(`  Found ${servers.length} servers`);
      allServers.push(...servers);

      // Rate limiting
      await sleep(1500);

      // Progress update every 10 pages
      if (page % 10 === 0) {
        console.log(`\n  Progress: ${allServers.length} servers collected\n`);
      }
    } catch (error) {
      console.error(`Error on page ${page}:`, error);
      continue;
    }
  }

  return allServers;
}

// Scrape official MCP Registry
async function scrapeOfficialRegistry(): Promise<GlamaServer[]> {
  console.log('\n=== Scraping Official MCP Registry ===');
  const allServers: GlamaServer[] = [];

  try {
    let cursor: string | null = null;
    let pageNum = 0;

    while (true) {
      pageNum++;
      const url = cursor
        ? `https://registry.modelcontextprotocol.io/v0.1/servers?cursor=${cursor}`
        : 'https://registry.modelcontextprotocol.io/v0.1/servers';

      console.log(`Fetching page ${pageNum}...`);
      const response = await fetch(url);
      const data = await response.json();

      if (!data.servers || data.servers.length === 0) break;

      for (const server of data.servers) {
        allServers.push({
          name: server.name || server.display_name,
          author: server.author || 'unknown',
          description: server.description || '',
          categories: server.categories || [],
          github_url: server.repository?.url,
          npm_package: server.package?.name,
        });
      }

      console.log(`  Found ${data.servers.length} servers`);

      cursor = data.next_cursor;
      if (!cursor) break;

      await sleep(500);
    }
  } catch (error) {
    console.error('Official registry error:', error);
  }

  return allServers;
}

// Scrape GitHub awesome-mcp lists
async function scrapeGitHubLists(): Promise<GlamaServer[]> {
  console.log('\n=== Scraping GitHub MCP Lists ===');
  const lists = [
    'https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md',
    'https://raw.githubusercontent.com/wong2/awesome-mcp-servers/main/README.md',
    'https://raw.githubusercontent.com/appcypher/awesome-mcp-servers/main/README.md',
  ];

  const allServers: GlamaServer[] = [];

  for (const url of lists) {
    try {
      console.log(`Fetching ${url}...`);
      const content = await fetchWithRetry(url);
      const servers = await extractServersWithDeepSeek(content);
      console.log(`  Found ${servers.length} servers`);
      allServers.push(...servers);
      await sleep(1000);
    } catch (error) {
      console.log(`  Skipped: ${url}`);
    }
  }

  return allServers;
}

// Deduplicate servers by slug
function deduplicateServers(servers: ScrapedServer[]): ScrapedServer[] {
  const seen = new Set<string>();
  return servers.filter(server => {
    if (seen.has(server.slug)) return false;
    seen.add(server.slug);
    return true;
  });
}

// Insert servers into Supabase
async function insertServers(servers: ScrapedServer[]): Promise<number> {
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

      // Insert server
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
        console.error(`Failed to insert ${server.name}:`, error.message);
        continue;
      }

      inserted++;

      // Get server ID for capabilities
      const { data: newServer } = await supabase
        .from('mcp_servers')
        .select('id')
        .eq('slug', server.slug)
        .single();

      if (newServer && server.capabilities) {
        for (const capName of server.capabilities) {
          // Upsert capability
          const { data: cap } = await supabase
            .from('capabilities')
            .upsert({ name: capName, category: server.category })
            .select('id')
            .single();

          if (cap) {
            await supabase
              .from('server_capabilities')
              .upsert({ server_id: newServer.id, capability_id: cap.id });
          }
        }
      }

      if (inserted % 100 === 0) {
        console.log(`  Inserted ${inserted} servers...`);
      }
    } catch (error) {
      console.error(`Error inserting ${server.name}:`, error);
    }
  }

  return inserted;
}

// Main scraping flow
async function main() {
  // Check for test mode
  const isTest = process.argv.includes('--test');
  const maxPages = isTest ? 5 : 200;
  const target = isTest ? '~250 servers (TEST)' : '10,000 servers';

  console.log('='.repeat(60));
  console.log(`MCP Server Scraper - Target: ${target}`);
  console.log('='.repeat(60));

  // Verify DeepSeek API key
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('ERROR: DEEPSEEK_API_KEY not set in .env');
    console.log('\nAdd to your .env file:');
    console.log('DEEPSEEK_API_KEY=your_api_key_here');
    process.exit(1);
  }

  // Collect from all sources
  const glamaServers = await scrapeGlama(maxPages);
  const registryServers = await scrapeOfficialRegistry();
  const githubServers = await scrapeGitHubLists();

  console.log('\n=== Collection Summary ===');
  console.log(`Glama.ai: ${glamaServers.length}`);
  console.log(`Official Registry: ${registryServers.length}`);
  console.log(`GitHub Lists: ${githubServers.length}`);

  // Combine all raw servers
  const allRaw = [...glamaServers, ...registryServers, ...githubServers];
  console.log(`\nTotal raw servers: ${allRaw.length}`);

  // Enrich each server with DeepSeek
  console.log('\n=== Enriching servers with DeepSeek ===');
  const enriched: ScrapedServer[] = [];

  for (let i = 0; i < allRaw.length; i++) {
    const raw = allRaw[i];
    console.log(`[${i + 1}/${allRaw.length}] Enriching: ${raw.name}`);

    const server = await enrichServerWithDeepSeek(raw);
    if (server) {
      enriched.push(server);
    }

    // Rate limit DeepSeek API
    if (i % 10 === 0) {
      await sleep(500);
    }

    // Progress update
    if ((i + 1) % 100 === 0) {
      console.log(`\n  Progress: ${enriched.length} enriched\n`);
    }
  }

  // Deduplicate
  console.log('\n=== Deduplicating ===');
  const unique = deduplicateServers(enriched);
  console.log(`Unique servers: ${unique.length}`);

  // Insert into database
  console.log('\n=== Inserting into Supabase ===');
  const inserted = await insertServers(unique);

  console.log('\n' + '='.repeat(60));
  console.log('SCRAPING COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total collected: ${allRaw.length}`);
  console.log(`Enriched: ${enriched.length}`);
  console.log(`Unique: ${unique.length}`);
  console.log(`Inserted: ${inserted}`);
}

main().catch(console.error);
