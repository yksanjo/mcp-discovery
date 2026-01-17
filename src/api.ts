import { createServer } from 'http';
import { handleDiscover } from './tools/discover.js';
import { handleGetMetrics } from './tools/metrics.js';
import { handleCompare } from './tools/compare.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 3000;

interface RequestBody {
  tool: string;
  args: Record<string, unknown>;
}

async function handleRequest(body: RequestBody): Promise<unknown> {
  const { tool, args } = body;

  switch (tool) {
    case 'discover_mcp_server':
      return handleDiscover(args);
    case 'get_server_metrics':
      return handleGetMetrics(args);
    case 'compare_servers':
      return handleCompare(args);
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'mcp-discovery' }));
    return;
  }

  // API endpoint
  if (req.url === '/api/v1/query' && req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body) as RequestBody;
        const result = await handleRequest(parsed);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('API error', { error: message });

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: message }));
      }
    });
    return;
  }

  // Convenience endpoints
  if (req.url === '/api/v1/discover' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const args = JSON.parse(body);
        const result = await handleDiscover(args);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  logger.info(`MCP Discovery API running on port ${PORT}`);
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: POST http://localhost:${PORT}/api/v1/discover`);
});
