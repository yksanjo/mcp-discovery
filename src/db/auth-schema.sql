-- API Keys and Usage Tracking Schema
-- Run this in your Supabase SQL editor

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  monthly_limit INT DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  query TEXT,
  response_time_ms INT,
  tokens_used INT DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_usage_api_key ON usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_api_key_month ON usage_logs(api_key_id, timestamp);

-- Function to get monthly usage for an API key
CREATE OR REPLACE FUNCTION get_monthly_usage(p_api_key_id UUID)
RETURNS INT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM usage_logs
    WHERE api_key_id = p_api_key_id
      AND timestamp >= date_trunc('month', NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(p_api_key TEXT)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INT,
  tier TEXT,
  api_key_id UUID
) AS $$
DECLARE
  v_key_data RECORD;
  v_usage INT;
BEGIN
  -- Get API key data
  SELECT * INTO v_key_data
  FROM api_keys
  WHERE key = p_api_key AND is_active = true;

  -- Key not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'none'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if expired
  IF v_key_data.expires_at IS NOT NULL AND v_key_data.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 0, 'expired'::TEXT, v_key_data.id;
    RETURN;
  END IF;

  -- Get monthly usage
  v_usage := get_monthly_usage(v_key_data.id);

  -- Enterprise has unlimited
  IF v_key_data.tier = 'enterprise' THEN
    RETURN QUERY SELECT true, 999999, v_key_data.tier, v_key_data.id;
    RETURN;
  END IF;

  -- Check limit
  RETURN QUERY SELECT
    v_usage < v_key_data.monthly_limit,
    GREATEST(0, v_key_data.monthly_limit - v_usage),
    v_key_data.tier,
    v_key_data.id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key(
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_tier TEXT DEFAULT 'free'
) RETURNS TEXT AS $$
DECLARE
  v_key TEXT;
  v_limit INT;
BEGIN
  -- Generate key
  v_key := 'mcp_' || encode(gen_random_bytes(24), 'hex');

  -- Set limit based on tier
  v_limit := CASE p_tier
    WHEN 'free' THEN 100
    WHEN 'pro' THEN 10000
    WHEN 'enterprise' THEN 999999
    ELSE 100
  END;

  -- Insert
  INSERT INTO api_keys (key, email, name, tier, monthly_limit)
  VALUES (v_key, p_email, p_name, p_tier, v_limit);

  RETURN v_key;
END;
$$ LANGUAGE plpgsql;

-- Create a default public API key for testing (optional - delete in production)
-- SELECT generate_api_key('public@mcp-discovery.com', 'Public Demo Key', 'free');
