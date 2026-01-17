-- MCP Discovery API Database Schema
-- Run this in your Supabase SQL editor

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- MCP Servers Registry
-- Stores information about each registered MCP server
CREATE TABLE IF NOT EXISTS mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  npm_package TEXT,
  github_url TEXT,
  description TEXT,
  description_embedding VECTOR(1536),
  install_command TEXT NOT NULL,
  docs_url TEXT,
  homepage_url TEXT,
  category TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capabilities table
-- Defines the capabilities that MCP servers can have
CREATE TABLE IF NOT EXISTS capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  description TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Server Capabilities junction table
-- Links MCP servers to their capabilities
CREATE TABLE IF NOT EXISTS server_capabilities (
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  capability_id UUID REFERENCES capabilities(id) ON DELETE CASCADE,
  PRIMARY KEY (server_id, capability_id)
);

-- Performance Metrics table
-- Stores time-series performance data for each MCP server
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  latency_ms FLOAT,
  success_rate FLOAT,
  error_count INT DEFAULT 0,
  active_connections INT DEFAULT 0,
  uptime_pct FLOAT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_servers_embedding ON mcp_servers
  USING ivfflat (description_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_capabilities_embedding ON capabilities
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_metrics_server_timestamp ON metrics(server_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_servers_category ON mcp_servers(category);
CREATE INDEX IF NOT EXISTS idx_servers_slug ON mcp_servers(slug);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on mcp_servers
DROP TRIGGER IF EXISTS update_mcp_servers_updated_at ON mcp_servers;
CREATE TRIGGER update_mcp_servers_updated_at
  BEFORE UPDATE ON mcp_servers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Semantic search function for MCP servers
-- Returns servers matching a query embedding with similarity scores
CREATE OR REPLACE FUNCTION match_servers(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5
) RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  npm_package TEXT,
  description TEXT,
  install_command TEXT,
  docs_url TEXT,
  github_url TEXT,
  category TEXT,
  is_verified BOOLEAN,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mcp_servers.id,
    mcp_servers.name,
    mcp_servers.slug,
    mcp_servers.npm_package,
    mcp_servers.description,
    mcp_servers.install_command,
    mcp_servers.docs_url,
    mcp_servers.github_url,
    mcp_servers.category,
    mcp_servers.is_verified,
    1 - (mcp_servers.description_embedding <=> query_embedding) AS similarity
  FROM mcp_servers
  WHERE mcp_servers.description_embedding IS NOT NULL
    AND 1 - (mcp_servers.description_embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest metrics for a server
CREATE OR REPLACE FUNCTION get_latest_metrics(
  p_server_id UUID
) RETURNS TABLE (
  latency_ms FLOAT,
  success_rate FLOAT,
  error_count INT,
  uptime_pct FLOAT,
  recorded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.latency_ms,
    m.success_rate,
    m.error_count,
    m.uptime_pct,
    m.timestamp AS recorded_at
  FROM metrics m
  WHERE m.server_id = p_server_id
  ORDER BY m.timestamp DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get metrics history for a server
CREATE OR REPLACE FUNCTION get_metrics_history(
  p_server_id UUID,
  p_hours INT DEFAULT 24
) RETURNS TABLE (
  latency_ms FLOAT,
  success_rate FLOAT,
  error_count INT,
  uptime_pct FLOAT,
  recorded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.latency_ms,
    m.success_rate,
    m.error_count,
    m.uptime_pct,
    m.timestamp AS recorded_at
  FROM metrics m
  WHERE m.server_id = p_server_id
    AND m.timestamp > NOW() - (p_hours || ' hours')::INTERVAL
  ORDER BY m.timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust based on your Supabase setup)
-- GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
