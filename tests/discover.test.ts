import { beforeAll, describe, expect, it } from 'vitest';

import { handleDiscover } from '../src/tools/discover.js';
import { handleGetMetrics } from '../src/tools/metrics.js';
import { handleCompare } from '../src/tools/compare.js';
import { computeTrustScore } from '../src/services/search.js';
import type { DiscoverOutput } from '../src/types/index.js';

beforeAll(() => {
  // Force local mode: no Supabase, no OpenAI.
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.OPENAI_API_KEY;
});

describe('discover_mcp_server (local mode, end to end)', () => {
  it('returns ranked recommendations with install commands', async () => {
    const result = (await handleDiscover({
      need: 'query a postgres database',
      limit: 5,
    })) as DiscoverOutput;

    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const rec of result.recommendations) {
      expect(rec.server.length).toBeGreaterThan(0);
      expect(rec.install_command.length).toBeGreaterThan(0);
      expect(rec.confidence).toBeGreaterThan(0);
      expect(rec.confidence).toBeLessThanOrEqual(1);
      expect(rec.trust_score).toBeGreaterThanOrEqual(0);
      expect(rec.trust_score).toBeLessThanOrEqual(100);
    }
  });

  it('honors exclude_servers', async () => {
    const first = (await handleDiscover({
      need: 'github repository tools',
      limit: 3,
      force_refresh: true,
    })) as DiscoverOutput;
    expect(first.recommendations.length).toBeGreaterThan(0);

    const topSlug = first.recommendations[0].server;
    const second = (await handleDiscover({
      need: 'github repository tools',
      limit: 3,
      force_refresh: true,
      constraints: { exclude_servers: [topSlug] },
    })) as DiscoverOutput;

    expect(second.recommendations.map((r) => r.server)).not.toContain(topSlug);
  });
});

describe('hosted-only tools in local mode', () => {
  it('get_server_metrics fails with a clear hint, not an env crash', async () => {
    await expect(handleGetMetrics({ server_id: 'foo' })).rejects.toThrow(
      /local mode/i
    );
  });

  it('compare_servers fails with a clear hint, not an env crash', async () => {
    await expect(
      handleCompare({ server_ids: ['a', 'b'] })
    ).rejects.toThrow(/local mode/i);
  });
});

describe('computeTrustScore (hosted-mode scoring)', () => {
  it('weights verification 40, uptime 40, success 20', () => {
    expect(computeTrustScore(true, 100, 100)).toBe(100);
    expect(computeTrustScore(false, 100, 100)).toBe(60);
    expect(computeTrustScore(true, null, null)).toBe(40);
    expect(computeTrustScore(false, 50, 50)).toBe(30);
  });
});
