import { discoverServers } from '../services/search.js';
import { validateDiscoverInput } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import type { DiscoverOutput } from '../types/index.js';

export const discoverToolDefinition = {
  name: 'discover_mcp_server',
  description:
    'Find MCP servers matching a natural language requirement. Returns ranked recommendations with capabilities, metrics, and installation commands.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      need: {
        type: 'string',
        description:
          'Natural language description of what you need (e.g., "database with authentication" or "send emails")',
      },
      constraints: {
        type: 'object',
        description: 'Optional constraints to filter results',
        properties: {
          max_latency_ms: {
            type: 'number',
            description: 'Maximum acceptable average latency in milliseconds',
          },
          required_features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Features that must be present (e.g., ["auth", "realtime"])',
          },
          exclude_servers: {
            type: 'array',
            items: { type: 'string' },
            description: 'Server slugs or IDs to exclude from results',
          },
        },
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 5, max: 20)',
      },
    },
    required: ['need'],
  },
};

export async function handleDiscover(
  args: Record<string, unknown>
): Promise<DiscoverOutput> {
  logger.info('Handling discover_mcp_server request', { args });

  try {
    const validatedInput = validateDiscoverInput(args);

    const result = await discoverServers({
      need: validatedInput.need,
      constraints: validatedInput.constraints,
      limit: validatedInput.limit,
    });

    logger.info('Discovery complete', {
      found: result.total_found,
      query_time_ms: result.query_time_ms,
    });

    return result;
  } catch (error) {
    logger.error('Discovery failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
