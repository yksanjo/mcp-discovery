import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { logger } from '../utils/logger.js';
import type { MatchedServer } from '../types/index.js';

/**
 * Local search backend.
 *
 * When no Supabase credentials are configured, the server runs in "local
 * mode": it loads the bundled registry snapshot (data_massive/) and answers
 * discover queries with keyword scoring instead of vector similarity.
 * No API keys, no network calls.
 */

interface RawRecord {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  npm_package?: string | null;
  github_url?: string | { url?: string } | null;
  install_command?: string | null;
  docs_url?: string | null;
  category?: string | null;
  source?: string | null;
  author?: string | null;
  stars?: number | null;
  downloads?: number | null;
}

export interface LocalServerRecord {
  name: string;
  slug: string;
  description: string | null;
  npm_package: string | null;
  github_url: string | null;
  install_command: string;
  docs_url: string | null;
  category: string | null;
  source: string | null;
  stars: number;
}

const moduleDir = dirname(fileURLToPath(import.meta.url));

/** Candidate dataset locations, first match wins. */
function datasetCandidates(): string[] {
  const candidates: string[] = [];
  if (process.env.MCP_DISCOVERY_DATA) {
    candidates.push(process.env.MCP_DISCOVERY_DATA);
  }
  // Works from both src/services (tsx, vitest) and dist/services (built).
  const root = join(moduleDir, '..', '..');
  candidates.push(
    join(root, 'data_massive', 'mcp_servers_all.json'),
    join(root, 'data', 'mcp_servers_complete.json'),
    // dist/ is one level deeper than src/ relative to the repo root when
    // tsc outputs to dist/services; cover repo root explicitly.
    join(root, '..', 'data_massive', 'mcp_servers_all.json'),
    join(root, '..', 'data', 'mcp_servers_complete.json')
  );
  return candidates;
}

export function isLocalMode(): boolean {
  return !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function normalizeGithubUrl(
  value: RawRecord['github_url']
): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.url ?? null;
}

let dataset: LocalServerRecord[] | null = null;

export function loadLocalDataset(): LocalServerRecord[] {
  if (dataset) return dataset;

  const path = datasetCandidates().find((p) => existsSync(p));
  if (!path) {
    throw new Error(
      'Local dataset not found. Clone the full repository (the dataset lives ' +
        'in data_massive/), or point MCP_DISCOVERY_DATA at a registry JSON file.'
    );
  }

  const raw = JSON.parse(readFileSync(path, 'utf8')) as RawRecord[];
  const bySlug = new Map<string, LocalServerRecord>();

  for (const r of raw) {
    const slug = (r.slug || r.name || '').trim();
    if (!slug) continue;
    const record: LocalServerRecord = {
      name: r.name || slug,
      slug,
      description: r.description ?? null,
      npm_package: r.npm_package ?? null,
      github_url: normalizeGithubUrl(r.github_url),
      install_command: r.install_command || `npx -y ${r.npm_package || slug}`,
      docs_url: r.docs_url ?? null,
      category: r.category ?? null,
      source: r.source ?? null,
      stars: typeof r.stars === 'number' ? r.stars : 0,
    };
    const existing = bySlug.get(slug.toLowerCase());
    if (!existing || record.stars > existing.stars) {
      bySlug.set(slug.toLowerCase(), record);
    }
  }

  dataset = [...bySlug.values()];
  logger.info(`Local dataset loaded: ${dataset.length} servers from ${path}`);
  return dataset;
}

/** Test hook: drop the memoized dataset so the next load re-reads disk. */
export function resetLocalDataset(): void {
  dataset = null;
}

const STOPWORDS = new Set([
  'a', 'an', 'and', 'for', 'i', 'in', 'mcp', 'need', 'of', 'or', 'server',
  'servers', 'that', 'the', 'to', 'tool', 'want', 'with',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Keyword relevance, 0–1. Name hits weigh most, then slug, then description.
 * A small log-scaled star boost breaks ties between equally relevant servers.
 */
export function scoreRecord(record: LocalServerRecord, tokens: string[]): number {
  if (tokens.length === 0) return 0;

  const name = record.name.toLowerCase();
  const slug = record.slug.toLowerCase();
  const description = (record.description || '').toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (name.includes(token)) score += 4;
    else if (slug.includes(token)) score += 3;
    else if (description.includes(token)) score += 2;
  }
  if (score === 0) return 0;

  const relevance = score / (tokens.length * 4);
  const starBoost = Math.min(0.15, Math.log10(record.stars + 1) / 20);
  return Math.min(1, relevance * 0.9 + starBoost);
}

/** Trust score for local mode, derived purely from GitHub stars (0–100). */
export function localTrustScore(stars: number): number {
  return Math.min(100, Math.round(Math.log10(stars + 1) * 25));
}

export function localSearch(query: string, limit: number): MatchedServer[] {
  const records = loadLocalDataset();
  const tokens = tokenize(query);

  const scored: Array<{ record: LocalServerRecord; score: number }> = [];
  for (const record of records) {
    const score = scoreRecord(record, tokens);
    if (score > 0.2) scored.push({ record, score });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ record, score }) => ({
    id: record.slug,
    name: record.name,
    slug: record.slug,
    npm_package: record.npm_package,
    description: record.description,
    install_command: record.install_command,
    docs_url: record.docs_url,
    github_url: record.github_url,
    category: record.category,
    is_verified: false,
    similarity: Math.round(score * 100) / 100,
    stars: record.stars,
  }));
}

export const LOCAL_MODE_HINT =
  'This tool needs live metrics from the hosted database and is unavailable ' +
  'in local mode. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable ' +
  'it (see README "Hosted mode").';
