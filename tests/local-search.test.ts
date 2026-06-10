import { beforeAll, describe, expect, it } from 'vitest';

import {
  isLocalMode,
  loadLocalDataset,
  localSearch,
  localTrustScore,
  scoreRecord,
  type LocalServerRecord,
} from '../src/services/local-search.js';

beforeAll(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe('isLocalMode', () => {
  it('is true when Supabase credentials are absent', () => {
    expect(isLocalMode()).toBe(true);
  });
});

describe('loadLocalDataset', () => {
  it('loads the bundled dataset with thousands of unique servers', () => {
    const records = loadLocalDataset();
    expect(records.length).toBeGreaterThan(5000);

    const slugs = new Set(records.map((r) => r.slug.toLowerCase()));
    expect(slugs.size).toBe(records.length); // deduped by slug
  });

  it('normalizes github_url to a string or null on every record', () => {
    for (const record of loadLocalDataset()) {
      expect(
        record.github_url === null || typeof record.github_url === 'string'
      ).toBe(true);
    }
  });

  it('gives every record a non-empty install_command', () => {
    for (const record of loadLocalDataset()) {
      expect(record.install_command.length).toBeGreaterThan(0);
    }
  });
});

describe('scoreRecord', () => {
  const record: LocalServerRecord = {
    name: 'slack-messenger',
    slug: 'slack-messenger',
    description: 'Send and read Slack messages from AI agents',
    npm_package: null,
    github_url: null,
    install_command: 'npx -y slack-messenger',
    docs_url: null,
    category: 'other',
    source: 'test',
    stars: 50,
  };

  it('scores a name match higher than a description-only match', () => {
    const nameHit = scoreRecord(record, ['slack']);
    const descHit = scoreRecord(record, ['agents']);
    expect(nameHit).toBeGreaterThan(descHit);
    expect(descHit).toBeGreaterThan(0);
  });

  it('returns 0 when nothing matches', () => {
    expect(scoreRecord(record, ['kubernetes'])).toBe(0);
    expect(scoreRecord(record, [])).toBe(0);
  });

  it('never exceeds 1', () => {
    expect(scoreRecord(record, ['slack', 'messenger'])).toBeLessThanOrEqual(1);
  });
});

describe('localSearch', () => {
  it('finds relevant servers for a real-world query', () => {
    const results = localSearch('send slack messages', 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(5);

    const text = (results[0].name + ' ' + (results[0].description || ''))
      .toLowerCase();
    expect(text).toContain('slack');
  });

  it('returns results sorted by similarity, descending', () => {
    const results = localSearch('postgres database', 10);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].similarity).toBeLessThanOrEqual(
        results[i - 1].similarity
      );
    }
  });

  it('returns an empty list for queries made of stopwords', () => {
    expect(localSearch('the mcp server', 5)).toEqual([]);
  });
});

describe('localTrustScore', () => {
  it('maps stars to a 0-100 scale monotonically', () => {
    expect(localTrustScore(0)).toBe(0);
    expect(localTrustScore(10)).toBeGreaterThan(localTrustScore(1));
    expect(localTrustScore(100000)).toBeLessThanOrEqual(100);
  });
});
