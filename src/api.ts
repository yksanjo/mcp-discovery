import { config } from 'dotenv';
config();

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { handleDiscover } from './tools/discover.js';
import { handleGetMetrics } from './tools/metrics.js';
import { handleCompare } from './tools/compare.js';
import { checkRateLimit, logUsage, generateApiKey } from './services/auth.js';
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

function getApiKey(req: IncomingMessage): string | null {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string') {
    return apiKeyHeader;
  }
  return null;
}

function getBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
  });
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const startTime = Date.now();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check (no auth required)
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'mcp-discovery', version: '1.0.0' }));
    return;
  }

  // Pricing info (no auth required)
  if (req.url === '/api/v1/pricing' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      tiers: {
        free: { price: 0, queries_per_month: 100, features: ['Basic discovery', 'Server info'] },
        pro: { price: 29, queries_per_month: 10000, features: ['All free features', 'Performance metrics', 'Priority support'] },
        enterprise: { price: 'custom', queries_per_month: 'unlimited', features: ['All pro features', 'SLA', 'Custom integrations'] }
      },
      signup_url: 'https://mcp-discovery.com/signup'
    }));
    return;
  }

  // Generate API key endpoint
  if (req.url === '/api/v1/keys' && req.method === 'POST') {
    const body = await getBody(req);
    try {
      const { email, name } = JSON.parse(body);
      if (!email) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email is required' }));
        return;
      }
      const apiKey = await generateApiKey(email, name, 'free');
      if (!apiKey) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to generate API key' }));
        return;
      }
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        api_key: apiKey,
        tier: 'free',
        monthly_limit: 100,
        message: 'Store this key securely. It will not be shown again.'
      }));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid request body' }));
    }
    return;
  }

  // Rate-limited endpoints below
  const apiKey = getApiKey(req);
  const rateLimit = await checkRateLimit(apiKey);

  // Add rate limit headers
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
  res.setHeader('X-RateLimit-Tier', rateLimit.tier);

  if (!rateLimit.allowed) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Rate limit exceeded',
      tier: rateLimit.tier,
      upgrade_url: 'https://mcp-discovery.com/upgrade',
      message: rateLimit.tier === 'invalid'
        ? 'Invalid API key. Get one at POST /api/v1/keys'
        : 'You have exceeded your monthly limit. Please upgrade.'
    }));
    return;
  }

  // API endpoint
  if (req.url === '/api/v1/query' && req.method === 'POST') {
    const body = await getBody(req);
    try {
      const parsed = JSON.parse(body) as RequestBody;
      const result = await handleRequest(parsed);
      const responseTime = Date.now() - startTime;

      await logUsage(rateLimit.apiKeyId, '/api/v1/query', parsed.tool, responseTime);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('API error', { error: message });
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
    return;
  }

  // Discovery endpoint
  if (req.url === '/api/v1/discover' && req.method === 'POST') {
    const body = await getBody(req);
    try {
      const args = JSON.parse(body);
      const result = await handleDiscover(args);
      const responseTime = Date.now() - startTime;

      await logUsage(rateLimit.apiKeyId, '/api/v1/discover', args.need || '', responseTime);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
    return;
  }

  // Metrics endpoint
  if (req.url === '/api/v1/metrics' && req.method === 'POST') {
    const body = await getBody(req);
    try {
      const args = JSON.parse(body);
      const result = await handleGetMetrics(args);
      const responseTime = Date.now() - startTime;

      await logUsage(rateLimit.apiKeyId, '/api/v1/metrics', args.server_id || '', responseTime);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
    return;
  }

  // Compare endpoint
  if (req.url === '/api/v1/compare' && req.method === 'POST') {
    const body = await getBody(req);
    try {
      const args = JSON.parse(body);
      const result = await handleCompare(args);
      const responseTime = Date.now() - startTime;

      await logUsage(rateLimit.apiKeyId, '/api/v1/compare', (args.server_ids || []).join(','), responseTime);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
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
