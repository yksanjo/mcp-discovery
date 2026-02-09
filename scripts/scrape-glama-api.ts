#!/usr/bin/env tsx

/**
 * Glama.ai API Scraper
 * Direct JSON API - No DeepSeek needed!
 * Target: 16,695+ servers
 */

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GlamaServer {
  id: string;
  name: string;
  namespace?: string;
  slug: string;
  description?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  npmPackage?: string;
  categories?: string[];
  stars?: number;
  downloads?: number;
}

interface GlamaResponse {
  pageInfo: {
    startCursor: string;
    endCursor: string;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  servers: GlamaServer[];
}

// Progress tracking
let totalFetched = 0;
let totalInserted = 0;
let totalSkipped = 0;
let totalErrors = 0;
let pageCount = 0;

function printProgress() {
  process.stdout.write(`\r[Page ${pageCount}] Fetched: ${totalFetched} | Inserted: ${totalInserted} | Skipped: ${totalSkipped} | Errors: ${totalErrors}    `);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Map Glama categories to our categories
function mapCategory(glamaCategories?: string[]): string {
  if (!glamaCategories || glamaCategories.length === 0) return 'other';

  const cat = glamaCategories[0].toLowerCase();

  const mapping: Record<string, string> = {
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
  };

  for (const [key, value] of Object.entries(mapping)) {
    if (cat.includes(key)) return value;
  }

  return 'other';
}

// Generate install command
function generateInstallCommand(server: GlamaServer): string {
  if (server.npmPackage) {
    return `npx -y ${server.npmPackage}`;
  }
  if (server.namespace && server.slug) {
    return `npx -y @${server.namespace}/${server.slug}`;
  }
  if (server.repository?.includes('github.com')) {
    // Extract package name from repo
    const match = server.repository.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return `npx -y @${match[1]}/${match[2]}`;
    }
  }
  return `npx -y ${server.slug || server.name.toLowerCase().replace(/\s+/g, '-')}`;
}

// Generate slug
function generateSlug(server: GlamaServer): string {
  if (server.slug) return server.slug;
  if (server.namespace && server.name) {
    return `${server.namespace}-${server.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  return server.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// Fetch servers from Glama API
async function fetchGlamaPage(cursor?: string): Promise<GlamaResponse | null> {
  try {
    const url = cursor
      ? `https://glama.ai/api/mcp/v1/servers?limit=50&after=${cursor}`
      : `https://glama.ai/api/mcp/v1/servers?limit=50`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MCP-Discovery-Bot/1.0',
      },
    });

    if (!response.ok) {
      console.error(`\nAPI error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`\nFetch error:`, error);
    return null;
  }
}

// Insert server into Supabase
async function insertServer(server: GlamaServer): Promise<boolean> {
  const slug = generateSlug(server);

  try {
    // Check if exists
    const { data: existing } = await supabase
      .from('mcp_servers')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      totalSkipped++;
      return false;
    }

    // Insert
    const { error } = await supabase
      .from('mcp_servers')
      .insert({
        name: server.name || slug,
        slug: slug,
        npm_package: server.npmPackage || null,
        github_url: server.repository || null,
        description: server.description || `MCP server: ${server.name}`,
        install_command: generateInstallCommand(server),
        docs_url: server.homepage || null,
        homepage_url: server.homepage || null,
        category: mapCategory(server.categories),
        is_verified: false,
      });

    if (error) {
      if (!error.message.includes('duplicate')) {
        totalErrors++;
      } else {
        totalSkipped++;
      }
      return false;
    }

    totalInserted++;
    return true;
  } catch (error) {
    totalErrors++;
    return false;
  }
}

// Main scraping function
async function scrapeGlamaApi() {
  console.log('='.repeat(60));
  console.log('GLAMA.AI API SCRAPER');
  console.log('Target: 16,695+ MCP Servers (Direct JSON - No DeepSeek)');
  console.log('='.repeat(60));
  console.log('');

  let cursor: string | undefined;
  let hasNextPage = true;
  const startTime = Date.now();

  while (hasNextPage) {
    pageCount++;

    const data = await fetchGlamaPage(cursor);

    if (!data || !data.servers || data.servers.length === 0) {
      console.log('\nNo more data or error occurred.');
      break;
    }

    totalFetched += data.servers.length;

    // Insert servers in parallel (batch of 10)
    const batchSize = 10;
    for (let i = 0; i < data.servers.length; i += batchSize) {
      const batch = data.servers.slice(i, i + batchSize);
      await Promise.all(batch.map(server => insertServer(server)));
      printProgress();
    }

    // Update pagination
    hasNextPage = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;

    // Rate limiting - be nice to the API
    await sleep(200);

    // Progress report every 50 pages
    if (pageCount % 50 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n[${elapsed}s] Progress: ${totalFetched} fetched, ${totalInserted} inserted`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n');
  console.log('='.repeat(60));
  console.log('SCRAPING COMPLETE');
  console.log('='.repeat(60));
  console.log(`Time elapsed: ${elapsed}s`);
  console.log(`Pages scraped: ${pageCount}`);
  console.log(`Total fetched: ${totalFetched}`);
  console.log(`New inserted: ${totalInserted}`);
  console.log(`Duplicates skipped: ${totalSkipped}`);
  console.log(`Errors: ${totalErrors}`);
  console.log('='.repeat(60));

  // Get final count
  const { count } = await supabase
    .from('mcp_servers')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal servers in database: ${count}`);
}

// Run
scrapeGlamaApi().catch(console.error);
