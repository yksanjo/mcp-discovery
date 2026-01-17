// MCP Discovery API Types

export interface MCPServer {
  id: string;
  name: string;
  slug: string;
  npm_package: string | null;
  github_url: string | null;
  description: string | null;
  description_embedding: number[] | null;
  install_command: string;
  docs_url: string | null;
  homepage_url: string | null;
  category: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Capability {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  embedding: number[] | null;
  created_at: string;
}

export interface ServerCapability {
  server_id: string;
  capability_id: string;
}

export interface Metrics {
  id: string;
  server_id: string;
  timestamp: string;
  latency_ms: number | null;
  success_rate: number | null;
  error_count: number;
  active_connections: number;
  uptime_pct: number | null;
}

// Tool Input/Output Types

export interface DiscoverInput {
  need: string;
  constraints?: {
    max_latency_ms?: number;
    required_features?: string[];
    exclude_servers?: string[];
  };
  limit?: number;
}

export interface ServerRecommendation {
  server: string;
  npm_package: string | null;
  install_command: string;
  confidence: number;
  description: string | null;
  capabilities: string[];
  metrics: {
    avg_latency_ms: number | null;
    uptime_pct: number | null;
    last_checked: string | null;
  };
  docs_url: string | null;
  github_url: string | null;
}

export interface DiscoverOutput {
  recommendations: ServerRecommendation[];
  total_found: number;
  query_time_ms: number;
}

export interface GetMetricsInput {
  server_id: string;
  time_range?: '1h' | '24h' | '7d' | '30d';
}

export interface MetricsHistory {
  timestamp: string;
  latency_ms: number | null;
  success_rate: number | null;
  uptime_pct: number | null;
}

export interface GetMetricsOutput {
  server: {
    id: string;
    name: string;
    slug: string;
  };
  metrics: {
    current: {
      latency_ms: number | null;
      success_rate: number | null;
      uptime_pct: number | null;
      active_connections: number;
    };
    history: MetricsHistory[];
  };
}

export interface CompareInput {
  server_ids: string[];
  compare_by?: ('latency' | 'uptime' | 'features')[];
}

export interface ServerComparison {
  id: string;
  name: string;
  slug: string;
  capabilities: string[];
  metrics: {
    latency_ms: number | null;
    uptime_pct: number | null;
    success_rate: number | null;
  };
  ranking: {
    by_latency: number;
    by_uptime: number;
    by_features: number;
  };
}

export interface CompareOutput {
  servers: ServerComparison[];
}

// Database search result type
export interface MatchedServer {
  id: string;
  name: string;
  slug: string;
  npm_package: string | null;
  description: string | null;
  install_command: string;
  docs_url: string | null;
  github_url: string | null;
  category: string | null;
  is_verified: boolean;
  similarity: number;
}

// Seed data type
export interface MCPServerSeed {
  name: string;
  slug: string;
  npm_package: string | null;
  github_url: string | null;
  description: string;
  install_command: string;
  docs_url: string | null;
  homepage_url: string | null;
  category: string;
  capabilities: string[];
}
