import { generateEmbedding } from './embeddings.js';
import {
  searchServersByEmbedding,
  getCapabilitiesForServer,
  getLatestMetrics,
} from '../db/queries.js';
import type {
  MatchedServer,
  ServerRecommendation,
  DiscoverInput,
} from '../types/index.js';

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  maxLatencyMs?: number;
  requiredFeatures?: string[];
  excludeServers?: string[];
}

export async function semanticSearch(
  query: string,
  options: SearchOptions = {}
): Promise<MatchedServer[]> {
  const { limit = 5, threshold = 0.3 } = options;

  // Generate embedding for the query
  const embedding = await generateEmbedding(query);

  // Search database with vector similarity
  const results = await searchServersByEmbedding(embedding, limit * 2, threshold);

  // Apply post-filters if specified
  let filtered = results;

  if (options.excludeServers?.length) {
    const excludeSet = new Set(
      options.excludeServers.map((s) => s.toLowerCase())
    );
    filtered = filtered.filter(
      (server) =>
        !excludeSet.has(server.slug.toLowerCase()) &&
        !excludeSet.has(server.id.toLowerCase())
    );
  }

  // Return top N after filtering
  return filtered.slice(0, limit);
}

export async function discoverServers(
  input: DiscoverInput
): Promise<{
  recommendations: ServerRecommendation[];
  total_found: number;
  query_time_ms: number;
}> {
  const startTime = Date.now();

  const searchOptions: SearchOptions = {
    limit: input.limit || 5,
    threshold: 0.3,
    maxLatencyMs: input.constraints?.max_latency_ms,
    requiredFeatures: input.constraints?.required_features,
    excludeServers: input.constraints?.exclude_servers,
  };

  // Perform semantic search
  const matchedServers = await semanticSearch(input.need, searchOptions);

  // Enrich results with capabilities and metrics
  const recommendations: ServerRecommendation[] = await Promise.all(
    matchedServers.map(async (server) => {
      // Get capabilities
      const capabilities = await getCapabilitiesForServer(server.id);
      const capabilityNames = capabilities.map((c) => c.name);

      // Get latest metrics
      const metrics = await getLatestMetrics(server.id);

      // Check if required features are present
      if (input.constraints?.required_features?.length) {
        const hasAllRequired = input.constraints.required_features.every(
          (feature) =>
            capabilityNames.some(
              (cap) =>
                cap.toLowerCase().includes(feature.toLowerCase()) ||
                feature.toLowerCase().includes(cap.toLowerCase())
            )
        );
        if (!hasAllRequired) {
          // Return with lower confidence
          server.similarity *= 0.5;
        }
      }

      // Check latency constraint
      if (
        input.constraints?.max_latency_ms &&
        metrics?.latency_ms &&
        metrics.latency_ms > input.constraints.max_latency_ms
      ) {
        server.similarity *= 0.7;
      }

      return {
        server: server.slug,
        npm_package: server.npm_package,
        install_command: server.install_command,
        confidence: Math.round(server.similarity * 100) / 100,
        description: server.description,
        capabilities: capabilityNames,
        metrics: {
          avg_latency_ms: metrics?.latency_ms || null,
          uptime_pct: metrics?.uptime_pct || null,
          last_checked: metrics?.timestamp || null,
        },
        docs_url: server.docs_url,
        github_url: server.github_url,
      };
    })
  );

  // Sort by confidence and filter out very low confidence results
  const sortedRecommendations = recommendations
    .filter((r) => r.confidence > 0.2)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, input.limit || 5);

  const queryTimeMs = Date.now() - startTime;

  return {
    recommendations: sortedRecommendations,
    total_found: sortedRecommendations.length,
    query_time_ms: queryTimeMs,
  };
}
