import { getSupabaseClient } from '../db/client.js';
import { logger } from '../utils/logger.js';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  tier: string;
  apiKeyId: string | null;
}

export async function checkRateLimit(apiKey: string | null): Promise<RateLimitResult> {
  // Allow requests without API key (public tier with strict limits)
  if (!apiKey) {
    return {
      allowed: true, // For now, allow public access
      remaining: 10,
      tier: 'public',
      apiKeyId: null,
    };
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_api_key: apiKey,
  });

  if (error) {
    logger.error('Rate limit check failed', { error: error.message });
    // Fail open for now - allow request but log error
    return {
      allowed: true,
      remaining: 0,
      tier: 'error',
      apiKeyId: null,
    };
  }

  if (!data || data.length === 0) {
    return {
      allowed: false,
      remaining: 0,
      tier: 'invalid',
      apiKeyId: null,
    };
  }

  const result = data[0];
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    tier: result.tier,
    apiKeyId: result.api_key_id,
  };
}

export async function logUsage(
  apiKeyId: string | null,
  endpoint: string,
  query: string,
  responseTimeMs: number
): Promise<void> {
  if (!apiKeyId) return;

  const supabase = getSupabaseClient();

  const { error } = await supabase.from('usage_logs').insert({
    api_key_id: apiKeyId,
    endpoint,
    query,
    response_time_ms: responseTimeMs,
  });

  if (error) {
    logger.error('Failed to log usage', { error: error.message });
  }
}

export async function generateApiKey(
  email: string,
  name?: string,
  tier: string = 'free'
): Promise<string | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('generate_api_key', {
    p_email: email,
    p_name: name || null,
    p_tier: tier,
  });

  if (error) {
    logger.error('Failed to generate API key', { error: error.message });
    return null;
  }

  return data;
}
