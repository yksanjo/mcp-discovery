import {
  getServerBySlugOrId,
  getLatestMetrics,
  getMetricsHistory,
} from '../db/queries.js';
import { validateGetMetricsInput } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import type { GetMetricsOutput } from '../types/index.js';

export const metricsToolDefinition = {
  name: 'get_server_metrics',
  description:
    'Get detailed performance metrics for a specific MCP server including latency, success rate, and uptime history.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      server_id: {
        type: 'string',
        description: 'Server slug (e.g., "supabase-mcp-server") or UUID',
      },
      time_range: {
        type: 'string',
        enum: ['1h', '24h', '7d', '30d'],
        description: 'Time range for historical metrics (default: 24h)',
      },
    },
    required: ['server_id'],
  },
};

const TIME_RANGE_HOURS: Record<string, number> = {
  '1h': 1,
  '24h': 24,
  '7d': 168,
  '30d': 720,
};

export async function handleGetMetrics(
  args: Record<string, unknown>
): Promise<GetMetricsOutput> {
  logger.info('Handling get_server_metrics request', { args });

  try {
    const validatedInput = validateGetMetricsInput(args);

    // Get server
    const server = await getServerBySlugOrId(validatedInput.server_id);
    if (!server) {
      throw new Error(`Server not found: ${validatedInput.server_id}`);
    }

    // Get latest metrics
    const latestMetrics = await getLatestMetrics(server.id);

    // Get metrics history
    const hours = TIME_RANGE_HOURS[validatedInput.time_range] || 24;
    const history = await getMetricsHistory(server.id, hours);

    const result: GetMetricsOutput = {
      server: {
        id: server.id,
        name: server.name,
        slug: server.slug,
      },
      metrics: {
        current: {
          latency_ms: latestMetrics?.latency_ms || null,
          success_rate: latestMetrics?.success_rate || null,
          uptime_pct: latestMetrics?.uptime_pct || null,
          active_connections: latestMetrics?.active_connections || 0,
        },
        history: history.map((m) => ({
          timestamp: m.timestamp,
          latency_ms: m.latency_ms,
          success_rate: m.success_rate,
          uptime_pct: m.uptime_pct,
        })),
      },
    };

    logger.info('Metrics retrieved', {
      server: server.slug,
      history_points: history.length,
    });

    return result;
  } catch (error) {
    logger.error('Failed to get metrics', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
