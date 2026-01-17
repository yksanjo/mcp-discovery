-- Agent Tools Schema - Universal Tool Registry
-- Run this in Supabase SQL Editor to expand beyond MCP

-- Universal tool registry (supports MCP, REST, GraphQL, etc.)
CREATE TABLE IF NOT EXISTS agent_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE,

  -- Discovery metadata
  description TEXT,
  category TEXT NOT NULL, -- communication, data, payments, productivity, ai, development, marketing, ecommerce, other
  protocol TEXT NOT NULL, -- mcp, rest, graphql, grpc, websocket, python, npm

  -- Integration details
  base_url TEXT,
  documentation_url TEXT,
  github_url TEXT,
  npm_package TEXT,
  pypi_package TEXT,
  openapi_spec_url TEXT,

  -- Authentication
  auth_type TEXT, -- oauth, api_key, jwt, bearer, none
  auth_docs_url TEXT,

  -- Search
  keywords TEXT[],
  use_cases TEXT[],
  embedding VECTOR(1536),

  -- Quality signals
  uptime_percentage FLOAT DEFAULT 99.0,
  avg_latency_ms INT DEFAULT 100,
  popularity_score INT DEFAULT 0,
  verified BOOLEAN DEFAULT false,

  -- Business
  pricing TEXT DEFAULT 'freemium', -- free, freemium, paid, enterprise
  pricing_url TEXT,
  tier TEXT DEFAULT 'free_listing', -- free_listing, verified, featured, sponsored

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration templates (ready-to-use code)
CREATE TABLE IF NOT EXISTS integration_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES agent_tools(id) ON DELETE CASCADE,
  framework TEXT NOT NULL, -- langchain, llamaindex, autogen, crewai, raw
  language TEXT NOT NULL, -- python, typescript, javascript
  code TEXT NOT NULL,
  example_usage TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tool usage analytics
CREATE TABLE IF NOT EXISTS tool_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES agent_tools(id) ON DELETE CASCADE,
  query TEXT,
  selected BOOLEAN DEFAULT false,
  framework TEXT,
  api_key_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_tools_category ON agent_tools(category);
CREATE INDEX IF NOT EXISTS idx_agent_tools_protocol ON agent_tools(protocol);
CREATE INDEX IF NOT EXISTS idx_agent_tools_embedding ON agent_tools
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_tool_usage_timestamp ON tool_usage(timestamp);

-- Generate slug from name
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Auto-generate slug on insert
CREATE OR REPLACE FUNCTION set_tool_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_tool_slug
  BEFORE INSERT ON agent_tools
  FOR EACH ROW
  EXECUTE FUNCTION set_tool_slug();

-- Universal search function
CREATE OR REPLACE FUNCTION search_agent_tools(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10,
  filter_category TEXT DEFAULT NULL,
  filter_protocol TEXT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  category TEXT,
  protocol TEXT,
  base_url TEXT,
  documentation_url TEXT,
  npm_package TEXT,
  auth_type TEXT,
  pricing TEXT,
  verified BOOLEAN,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    at.id,
    at.name,
    at.slug,
    at.description,
    at.category,
    at.protocol,
    at.base_url,
    at.documentation_url,
    at.npm_package,
    at.auth_type,
    at.pricing,
    at.verified,
    1 - (at.embedding <=> query_embedding) AS similarity
  FROM agent_tools at
  WHERE
    1 - (at.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR at.category = filter_category)
    AND (filter_protocol IS NULL OR at.protocol = filter_protocol)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Get tools by category
CREATE OR REPLACE FUNCTION get_tools_by_category(p_category TEXT, p_limit INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  protocol TEXT,
  pricing TEXT,
  verified BOOLEAN,
  popularity_score INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    at.id,
    at.name,
    at.slug,
    at.description,
    at.protocol,
    at.pricing,
    at.verified,
    at.popularity_score
  FROM agent_tools at
  WHERE at.category = p_category
  ORDER BY at.verified DESC, at.popularity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Increment popularity on selection
CREATE OR REPLACE FUNCTION increment_tool_popularity(p_tool_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE agent_tools
  SET popularity_score = popularity_score + 1
  WHERE id = p_tool_id;
END;
$$ LANGUAGE plpgsql;

-- Summary stats
CREATE OR REPLACE FUNCTION get_tool_stats()
RETURNS TABLE (
  total_tools BIGINT,
  by_category JSONB,
  by_protocol JSONB,
  verified_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_tools,
    jsonb_object_agg(category, cat_count) AS by_category,
    jsonb_object_agg(protocol, proto_count) AS by_protocol,
    (SELECT COUNT(*) FROM agent_tools WHERE verified = true)::BIGINT AS verified_count
  FROM (
    SELECT category, COUNT(*) AS cat_count FROM agent_tools GROUP BY category
  ) cats,
  (
    SELECT protocol, COUNT(*) AS proto_count FROM agent_tools GROUP BY protocol
  ) protos;
END;
$$ LANGUAGE plpgsql;
