# MCP Discovery Optimization Plan

## Target: Sub-100ms queries across 10,000+ servers

---

## 1. Vector Embeddings for Semantic Search

Agents ask natural language queries like "I need to connect to Notion" or "database with read/write". Use embeddings for semantic matching.

### Implementation:

```sql
-- Enable pgvector in Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column
ALTER TABLE mcp_servers ADD COLUMN embedding vector(1536);

-- Create HNSW index for fast similarity search
CREATE INDEX ON mcp_servers USING hnsw (embedding vector_cosine_ops);
```

### Generate embeddings with DeepSeek/OpenAI:
- Embed: `name + description + capabilities`
- Store 1536-dim vectors
- Query: embed user query → find top-k similar

---

## 2. Database Indexes

```sql
-- Full-text search index
CREATE INDEX idx_servers_fts ON mcp_servers
USING gin(to_tsvector('english', name || ' ' || description));

-- Category index
CREATE INDEX idx_servers_category ON mcp_servers(category);

-- Slug index (unique lookups)
CREATE INDEX idx_servers_slug ON mcp_servers(slug);

-- Composite index for common queries
CREATE INDEX idx_servers_category_verified ON mcp_servers(category, is_verified);
```

---

## 3. Caching Strategy

### Layer 1: Edge Cache (Vercel/Cloudflare)
- Cache popular queries at edge
- TTL: 5-15 minutes
- Cache key: hash of query params

### Layer 2: Redis/Upstash
- Cache search results
- Cache embedding lookups
- TTL: 1 hour

### Layer 3: In-Memory (Node.js)
- LRU cache for hot queries
- Category lists
- Capability mappings

---

## 4. Query Optimization

### Hybrid Search (Best Results)
```typescript
async function hybridSearch(query: string, limit = 10) {
  // 1. Semantic search (embeddings)
  const embedding = await getEmbedding(query);
  const semanticResults = await supabase.rpc('match_servers', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: limit * 2
  });

  // 2. Keyword search (full-text)
  const keywordResults = await supabase
    .from('mcp_servers')
    .select('*')
    .textSearch('description', query)
    .limit(limit);

  // 3. Merge and rank
  return mergeAndRank(semanticResults, keywordResults, limit);
}
```

### Supabase RPC Function for Vector Search:
```sql
CREATE OR REPLACE FUNCTION match_servers(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
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
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mcp_servers.id,
    mcp_servers.name,
    mcp_servers.slug,
    mcp_servers.description,
    mcp_servers.install_command,
    1 - (mcp_servers.embedding <=> query_embedding) as similarity
  FROM mcp_servers
  WHERE 1 - (mcp_servers.embedding <=> query_embedding) > match_threshold
  ORDER BY mcp_servers.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 5. Response Optimization

### Pagination
```typescript
// Cursor-based pagination (faster than offset)
const { data } = await supabase
  .from('mcp_servers')
  .select('id, name, slug, description, install_command')
  .gt('id', cursor)
  .order('id')
  .limit(20);
```

### Field Selection
```typescript
// Only return fields agents need
const AGENT_FIELDS = 'id,name,slug,description,install_command,category';
```

### Compression
- Enable gzip/brotli on API responses
- Reduces payload 60-80%

---

## 6. Pre-computed Rankings

### Popularity Score
```sql
ALTER TABLE mcp_servers ADD COLUMN popularity_score float DEFAULT 0;

-- Update based on:
-- - GitHub stars
-- - NPM downloads
-- - Query frequency
-- - Install success rate
```

### Category Leaders
```sql
-- Materialized view for "top in category"
CREATE MATERIALIZED VIEW top_servers_by_category AS
SELECT DISTINCT ON (category)
  id, name, slug, category, popularity_score
FROM mcp_servers
ORDER BY category, popularity_score DESC;

-- Refresh periodically
REFRESH MATERIALIZED VIEW top_servers_by_category;
```

---

## 7. Agent-Optimized API

### Endpoint: `/api/v1/discover`
```typescript
interface DiscoverRequest {
  need: string;           // Natural language query
  category?: string;      // Optional filter
  limit?: number;         // Default 5
  include_install?: boolean; // Include install commands
}

interface DiscoverResponse {
  servers: Array<{
    name: string;
    slug: string;
    description: string;
    install_command: string;
    confidence: number;    // 0-1 match score
  }>;
  query_time_ms: number;
}
```

### Response Time Targets
| Query Type | Target | Method |
|------------|--------|--------|
| By slug | <10ms | Index lookup |
| By category | <20ms | Index + cache |
| Semantic search | <100ms | Vector + cache |
| Full-text | <50ms | FTS index |

---

## 8. Monitoring & Analytics

### Track:
- Query patterns (what agents search for)
- Popular servers
- Failed searches (gaps in coverage)
- Response times (P50, P95, P99)

### Supabase Analytics Table:
```sql
CREATE TABLE search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text,
  results_count int,
  top_result_slug text,
  response_time_ms int,
  created_at timestamptz DEFAULT now()
);
```

---

## 9. Implementation Priority

### Phase 1: Essential (Do First)
1. Add database indexes
2. Implement basic caching
3. Optimize API response fields

### Phase 2: Semantic Search
1. Generate embeddings for all servers
2. Add pgvector column and index
3. Implement hybrid search

### Phase 3: Scale
1. Edge caching
2. Redis layer
3. Analytics & monitoring

---

## 10. Quick Wins (Today)

```sql
-- Run these in Supabase SQL Editor immediately:

-- 1. Add indexes
CREATE INDEX IF NOT EXISTS idx_servers_category ON mcp_servers(category);
CREATE INDEX IF NOT EXISTS idx_servers_slug ON mcp_servers(slug);
CREATE INDEX IF NOT EXISTS idx_servers_name ON mcp_servers(name);

-- 2. Full-text search
CREATE INDEX IF NOT EXISTS idx_servers_fts ON mcp_servers
USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- 3. Add popularity column for ranking
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS popularity_score float DEFAULT 0;
```
