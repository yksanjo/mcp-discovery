import {
  getServerBySlugOrId,
  getCapabilitiesForServer,
  getLatestMetrics,
} from '../db/queries.js';
import { validateCompareInput } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import type { CompareOutput, ServerComparison, MCPServer } from '../types/index.js';

export const compareToolDefinition = {
  name: 'compare_servers',
  description:
    'Compare multiple MCP servers side-by-side on latency, uptime, and features. Returns rankings for each dimension.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      server_ids: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Array of server slugs or UUIDs to compare (2-10 servers)',
      },
      compare_by: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['latency', 'uptime', 'features'],
        },
        description:
          'Dimensions to compare (default: all)',
      },
    },
    required: ['server_ids'],
  },
};

interface ServerData {
  server: MCPServer;
  capabilities: string[];
  metrics: {
    latency_ms: number | null;
    uptime_pct: number | null;
    success_rate: number | null;
  };
}

export async function handleCompare(
  args: Record<string, unknown>
): Promise<CompareOutput> {
  logger.info('Handling compare_servers request', { args });

  try {
    const validatedInput = validateCompareInput(args);

    // Fetch all servers and their data
    const serversData: ServerData[] = [];

    for (const serverId of validatedInput.server_ids) {
      const server = await getServerBySlugOrId(serverId);
      if (!server) {
        throw new Error(`Server not found: ${serverId}`);
      }

      const capabilities = await getCapabilitiesForServer(server.id);
      const metrics = await getLatestMetrics(server.id);

      serversData.push({
        server,
        capabilities: capabilities.map((c) => c.name),
        metrics: {
          latency_ms: metrics?.latency_ms || null,
          uptime_pct: metrics?.uptime_pct || null,
          success_rate: metrics?.success_rate || null,
        },
      });
    }

    // Calculate rankings
    const rankings = calculateRankings(
      serversData,
      validatedInput.compare_by
    );

    // Build response
    const servers: ServerComparison[] = serversData.map((data, index) => ({
      id: data.server.id,
      name: data.server.name,
      slug: data.server.slug,
      capabilities: data.capabilities,
      metrics: data.metrics,
      ranking: rankings[index],
    }));

    logger.info('Comparison complete', {
      servers_compared: servers.length,
    });

    return { servers };
  } catch (error) {
    logger.error('Comparison failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

function calculateRankings(
  serversData: ServerData[],
  compareDimensions: string[]
): Array<{ by_latency: number; by_uptime: number; by_features: number }> {
  const rankings: Array<{
    by_latency: number;
    by_uptime: number;
    by_features: number;
  }> = [];

  // Calculate latency ranking (lower is better)
  const latencyRanking = calculateDimensionRanking(
    serversData,
    (d) => d.metrics.latency_ms,
    true // ascending - lower latency is better
  );

  // Calculate uptime ranking (higher is better)
  const uptimeRanking = calculateDimensionRanking(
    serversData,
    (d) => d.metrics.uptime_pct,
    false // descending - higher uptime is better
  );

  // Calculate features ranking (more features is better)
  const featuresRanking = calculateDimensionRanking(
    serversData,
    (d) => d.capabilities.length,
    false // descending - more features is better
  );

  for (let i = 0; i < serversData.length; i++) {
    rankings.push({
      by_latency: compareDimensions.includes('latency')
        ? latencyRanking[i]
        : 0,
      by_uptime: compareDimensions.includes('uptime') ? uptimeRanking[i] : 0,
      by_features: compareDimensions.includes('features')
        ? featuresRanking[i]
        : 0,
    });
  }

  return rankings;
}

function calculateDimensionRanking(
  serversData: ServerData[],
  getValue: (data: ServerData) => number | null,
  ascending: boolean
): number[] {
  const indexed = serversData.map((data, index) => ({
    index,
    value: getValue(data),
  }));

  // Sort: null values go last
  const sorted = [...indexed].sort((a, b) => {
    if (a.value === null && b.value === null) return 0;
    if (a.value === null) return 1;
    if (b.value === null) return -1;
    return ascending ? a.value - b.value : b.value - a.value;
  });

  // Assign rankings (1 = best)
  const rankings = new Array<number>(serversData.length);
  sorted.forEach((item, rank) => {
    rankings[item.index] = item.value !== null ? rank + 1 : 0;
  });

  return rankings;
}
