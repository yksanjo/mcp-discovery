import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { discoverToolDefinition, handleDiscover } from './tools/discover.js';
import { metricsToolDefinition, handleGetMetrics } from './tools/metrics.js';
import { compareToolDefinition, handleCompare } from './tools/compare.js';
import { logger } from './utils/logger.js';

const TOOLS = [
  discoverToolDefinition,
  metricsToolDefinition,
  compareToolDefinition,
];

export function createServer(): Server {
  const server = new Server(
    {
      name: 'mcp-discovery',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list_tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Listing tools');
    return {
      tools: TOOLS,
    };
  });

  // Handle call_tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.info(`Tool called: ${name}`, { args });

    try {
      let result: unknown;

      switch (name) {
        case 'discover_mcp_server':
          result = await handleDiscover(args || {});
          break;

        case 'get_server_metrics':
          result = await handleGetMetrics(args || {});
          break;

        case 'compare_servers':
          result = await handleCompare(args || {});
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Tool error: ${name}`, { error: errorMessage });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: errorMessage }),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export async function runServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  logger.info('Starting MCP Discovery Server');

  await server.connect(transport);

  logger.info('MCP Discovery Server connected and ready');
}
