import { describe, expect, it } from 'vitest';

import {
  validateCompareInput,
  validateDiscoverInput,
  validateGetMetricsInput,
} from '../src/utils/validation.js';

describe('validateDiscoverInput', () => {
  it('accepts a minimal valid input and applies defaults', () => {
    const result = validateDiscoverInput({ need: 'send emails' });
    expect(result.need).toBe('send emails');
    expect(result.limit).toBe(5);
  });

  it('accepts force_refresh and constraints', () => {
    const result = validateDiscoverInput({
      need: 'database',
      force_refresh: true,
      constraints: { max_latency_ms: 500, exclude_servers: ['foo'] },
    });
    expect(result.force_refresh).toBe(true);
    expect(result.constraints?.max_latency_ms).toBe(500);
  });

  it('rejects an empty need and limits over 20', () => {
    expect(() => validateDiscoverInput({ need: '' })).toThrow();
    expect(() => validateDiscoverInput({ need: 'x', limit: 21 })).toThrow();
  });
});

describe('validateGetMetricsInput', () => {
  it('defaults time_range to 24h', () => {
    expect(validateGetMetricsInput({ server_id: 'foo' }).time_range).toBe(
      '24h'
    );
  });

  it('rejects unknown time ranges', () => {
    expect(() =>
      validateGetMetricsInput({ server_id: 'foo', time_range: '1y' })
    ).toThrow();
  });
});

describe('validateCompareInput', () => {
  it('requires at least 2 and at most 10 servers', () => {
    expect(() => validateCompareInput({ server_ids: ['a'] })).toThrow();
    expect(() =>
      validateCompareInput({ server_ids: Array(11).fill('x') })
    ).toThrow();
    expect(
      validateCompareInput({ server_ids: ['a', 'b'] }).compare_by
    ).toEqual(['latency', 'uptime', 'features']);
  });
});
