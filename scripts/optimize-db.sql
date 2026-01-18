-- MCP Discovery Database Optimizations
-- Run this in Supabase SQL Editor

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy text search

-- 2. Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_servers_slug ON mcp_servers(slug);
CREATE INDEX IF NOT EXISTS idx_servers_category ON mcp_servers(category);
CREATE INDEX IF NOT EXISTS idx_servers_name ON mcp_servers(name);
CREATE INDEX IF NOT EXISTS idx_servers_npm ON mcp_servers(npm_package) WHERE npm_package IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_servers_verified ON mcp_servers(is_verified) WHERE is_verified = true;

-- 3. Full-text search index
CREATE INDEX IF NOT EXISTS idx_servers_fts ON mcp_servers
USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- 4. Trigram index for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_servers_name_trgm ON mcp_servers USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_servers_desc_trgm ON mcp_servers USING gin(description gin_trgm_ops);

-- 5. Add popularity score column
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS popularity_score float DEFAULT 0;
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS query_count int DEFAULT 0;

-- 6. Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_servers_category_pop ON mcp_servers(category, popularity_score DESC);

-- 7. Optimized match_servers function with caching hints
CREATE OR REPLACE FUNCTION match_servers(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  npm_package text,
  github_url text,
  description text,
  install_command text,
  docs_url text,
  category text,
  is_verified boolean,
  similarity float
)
LANGUAGE plpgsql
STABLE  -- Indicates function has no side effects (allows caching)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.slug,
    s.npm_package,
    s.github_url,
    s.description,
    s.install_command,
    s.docs_url,
    s.category,
    s.is_verified,
    1 - (s.description_embedding <=> query_embedding) as similarity
  FROM mcp_servers s
  WHERE s.description_embedding IS NOT NULL
    AND 1 - (s.description_embedding <=> query_embedding) > match_threshold
  ORDER BY s.description_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 8. Full-text search function
CREATE OR REPLACE FUNCTION search_servers_text(
  search_query text,
  result_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  install_command text,
  category text,
  rank float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.slug,
    s.description,
    s.install_command,
    s.category,
    ts_rank(
      to_tsvector('english', coalesce(s.name, '') || ' ' || coalesce(s.description, '')),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM mcp_servers s
  WHERE to_tsvector('english', coalesce(s.name, '') || ' ' || coalesce(s.description, ''))
        @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$;

-- 9. Fuzzy search function (for typo tolerance)
CREATE OR REPLACE FUNCTION search_servers_fuzzy(
  search_query text,
  similarity_threshold float DEFAULT 0.3,
  result_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  install_command text,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.slug,
    s.description,
    s.install_command,
    greatest(
      similarity(s.name, search_query),
      similarity(s.description, search_query)
    ) as sim
  FROM mcp_servers s
  WHERE similarity(s.name, search_query) > similarity_threshold
     OR similarity(s.description, search_query) > similarity_threshold
  ORDER BY sim DESC
  LIMIT result_limit;
END;
$$;

-- 10. Hybrid search combining semantic + keyword
CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding vector(1536),
  search_text text,
  semantic_weight float DEFAULT 0.7,
  keyword_weight float DEFAULT 0.3,
  result_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  install_command text,
  category text,
  combined_score float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH semantic AS (
    SELECT
      s.id,
      s.name,
      s.slug,
      s.description,
      s.install_command,
      s.category,
      (1 - (s.description_embedding <=> query_embedding)) as score
    FROM mcp_servers s
    WHERE s.description_embedding IS NOT NULL
  ),
  keyword AS (
    SELECT
      s.id,
      ts_rank(
        to_tsvector('english', coalesce(s.name, '') || ' ' || coalesce(s.description, '')),
        plainto_tsquery('english', search_text)
      ) as score
    FROM mcp_servers s
  )
  SELECT
    sem.id,
    sem.name,
    sem.slug,
    sem.description,
    sem.install_command,
    sem.category,
    (sem.score * semantic_weight + coalesce(kw.score, 0) * keyword_weight) as combined_score
  FROM semantic sem
  LEFT JOIN keyword kw ON sem.id = kw.id
  WHERE sem.score > 0.3 OR kw.score > 0
  ORDER BY combined_score DESC
  LIMIT result_limit;
END;
$$;

-- 11. Category stats function for dashboard
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE (
  category text,
  server_count bigint,
  avg_popularity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    category,
    count(*) as server_count,
    avg(popularity_score) as avg_popularity
  FROM mcp_servers
  GROUP BY category
  ORDER BY server_count DESC;
$$;

-- 12. Update popularity based on queries (call this after each search)
CREATE OR REPLACE FUNCTION increment_query_count(server_slugs text[])
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE mcp_servers
  SET
    query_count = query_count + 1,
    popularity_score = popularity_score + 0.1
  WHERE slug = ANY(server_slugs);
END;
$$;

-- 13. Analyze tables for query optimization
ANALYZE mcp_servers;
ANALYZE capabilities;
ANALYZE server_capabilities;
ANALYZE metrics;
