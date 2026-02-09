import { config } from 'dotenv';
config();

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { handleDiscover } from './tools/discover.js';
import { handleGetMetrics } from './tools/metrics.js';
import { handleCompare } from './tools/compare.js';
import { checkRateLimit, logUsage, generateApiKey } from './services/auth.js';
import { logger } from './utils/logger.js';
import { getSupabaseClient } from './db/client.js';
import { v4 as uuidv4 } from 'uuid';

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

  // ==================== MCP CURATOR ROUTES ====================
  
  // MCP Curator health check
  if (req.url === '/api/v1/curator/health' && req.method === 'GET') {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('mcp_servers').select('count', { count: 'exact', head: true });
      
      if (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'unhealthy',
          error: 'Database connection failed',
          details: error.message
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'MCP Curator API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'unhealthy',
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
    return;
  }

  // MCP Curator route endpoint (public demo)
  if (req.url === '/api/v1/curator/recommend' && req.method === 'POST') {
    const body = await getBody(req);
    try {
      const { task } = JSON.parse(body);
      
      if (!task) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Task description is required' }));
        return;
      }

      // For demo, return mock data
      const recommendations = getMockRecommendations(task);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        recommendations,
        note: 'Demo mode - using mock data. Get API key for real routing.'
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
    return;
  }

  // MCP Curator route endpoint (authenticated)
  if (req.url === '/api/v1/curator/route' && req.method === 'POST') {
    const body = await getBody(req);
    try {
      const { task, max_cost, max_latency, min_reliability, required_tags } = JSON.parse(body);
      
      if (!task) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Task description is required' }));
        return;
      }

      // Get optimal server using database function
      const supabase = getSupabaseClient();
      const { data: servers, error } = await supabase.rpc('get_optimal_server', {
        p_task_description: task,
        p_max_cost: max_cost || 1.0,
        p_max_latency_ms: max_latency || 5000,
        p_min_reliability: min_reliability || 0.8,
        p_required_tags: required_tags || []
      });

      if (error) {
        logger.error('Routing error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to find optimal server' }));
        return;
      }

      if (!servers || servers.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No suitable MCP servers found for this task' }));
        return;
      }

      const recommended = servers[0];
      const alternatives = servers.slice(1, 4);

      // Create routing decision record
      const routingDecisionId = uuidv4();
      await supabase.from('routing_decisions').insert({
        id: routingDecisionId,
        api_key_id: rateLimit.apiKeyId,
        task_description: task,
        recommended_server_id: recommended.server_id,
        alternative_server_ids: alternatives.map((s: any) => s.server_id),
        estimated_cost: recommended.estimated_cost,
        estimated_latency_ms: recommended.estimated_latency_ms,
        routing_reason: recommended.routing_reason
      });

      const responseTime = Date.now() - startTime;
      await logUsage(rateLimit.apiKeyId, '/api/v1/curator/route', task, responseTime);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        routing_id: routingDecisionId,
        recommended: {
          server_id: recommended.server_id,
          name: recommended.server_name,
          slug: recommended.server_slug,
          install_command: recommended.install_command,
          estimated_cost: recommended.estimated_cost,
          estimated_latency_ms: recommended.estimated_latency_ms,
          reliability_score: recommended.reliability_score,
          suitability_score: recommended.suitability_score,
          matching_tags: recommended.matching_tags,
          routing_reason: recommended.routing_reason
        },
        alternatives: alternatives.map((alt: any) => ({
          server_id: alt.server_id,
          name: alt.server_name,
          slug: alt.server_slug,
          estimated_cost: alt.estimated_cost,
          estimated_latency_ms: alt.estimated_latency_ms,
          suitability_score: alt.suitability_score
        })),
        metadata: {
          processing_time_ms: responseTime,
          total_servers_considered: servers.length
        }
      }));
    } catch (error) {
      logger.error('Route endpoint error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // MCP Curator track usage endpoint
  if (req.url === '/api/v1/curator/track' && req.method === 'POST') {
    const body = await getBody(req);
    try {
      const { routing_id, server_id, actual_cost, actual_latency, success, error_message } = JSON.parse(body);
      
      if (!routing_id || !server_id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'routing_id and server_id are required' }));
        return;
      }

      const supabase = getSupabaseClient();
      
      // Verify the routing decision exists and belongs to this API key
      const { data: routingDecision, error: routingError } = await supabase
        .from('routing_decisions')
        .select('*')
        .eq('id', routing_id)
        .eq('api_key_id', rateLimit.apiKeyId)
        .single();

      if (routingError || !routingDecision) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Routing decision not found or access denied' }));
        return;
      }

      // Record actual usage
      const usageId = uuidv4();
      const { error: usageError } = await supabase.from('actual_usage').insert({
        id: usageId,
        routing_decision_id: routing_id,
        server_id,
        actual_cost: actual_cost || 0,
        actual_latency_ms: actual_latency || 0,
        success: success !== false,
        error_message,
        completed_at: new Date().toISOString()
      });

      if (usageError) {
        logger.error('Usage tracking error:', usageError);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to track usage' }));
        return;
      }

      await logUsage(rateLimit.apiKeyId, '/api/v1/curator/track', `routing_id: ${routing_id}`, 0);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        usage_id: usageId,
        message: 'Usage tracked successfully'
      }));
    } catch (error) {
      logger.error('Track endpoint error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // MCP Curator usage stats endpoint
  if (req.url === '/api/v1/curator/usage' && req.method === 'GET') {
    try {
      const supabase = getSupabaseClient();
      
      // Get current month usage
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      // Get routing decisions count for this month
      const { count: decisionsCount, error: decisionsError } = await supabase
        .from('routing_decisions')
        .select('*', { count: 'exact', head: true })
        .eq('api_key_id', rateLimit.apiKeyId)
        .gte('created_at', monthStart);

      if (decisionsError) {
        logger.error('Decisions count error:', decisionsError);
      }

      // Get actual costs for this month (simplified)
      const { data: usageData, error: usageError } = await supabase
        .from('actual_usage')
        .select('actual_cost')
        .not('actual_cost', 'is', null);

      if (usageError) {
        logger.error('Usage data error:', usageError);
      }

      const totalCost = usageData?.reduce((sum: number, row: any) => sum + (row.actual_cost || 0), 0) || 0;

      // Get most used servers (simplified for now)
      const { data: topServers, error: serversError } = await supabase
        .from('actual_usage')
        .select('server_id, mcp_servers(name, slug, cost_per_call)')
        .in('routing_decision_id', 
          supabase.from('routing_decisions')
            .select('id')
            .eq('api_key_id', rateLimit.apiKeyId) as any
        )
        .limit(5);

      if (serversError) {
        logger.error('Top servers error:', serversError);
      }

      await logUsage(rateLimit.apiKeyId, '/api/v1/curator/usage', '', 0);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        current_month: {
          routing_decisions: decisionsCount || 0,
          total_cost: totalCost,
          month: now.toISOString().slice(0, 7)
        },
        top_servers: (topServers || []).map((server: any) => ({
          server_id: server.server_id,
          name: server.mcp_servers?.name,
          slug: server.mcp_servers?.slug,
          cost_per_call: server.mcp_servers?.cost_per_call
        })),
        api_key_tier: rateLimit.tier
      }));
    } catch (error) {
      logger.error('Usage endpoint error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // ==================== END MCP CURATOR ROUTES ====================

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  logger.info(`MCP Discovery API running on port ${PORT}`);
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: POST http://localhost:${PORT}/api/v1/discover`);
  console.log(`MCP Curator demo: POST http://localhost:${PORT}/api/v1/curator/recommend`);
});

// Mock recommendations function for demo
function getMockRecommendations(task: string): any[] {
  const taskLower = task.toLowerCase();
  
  const mockServers = [
    {
      name: 'postgres-mcp',
      slug: 'postgres-mcp',
      install_command: 'npm install -g postgres-mcp',
      estimated_cost: 0.0025,
      estimated_latency_ms: 150,
      reliability_score: 0.98,
      routing_reason: 'Best for database queries'
    },
    {
      name: 'github-mcp',
      slug: 'github-mcp',
      install_command: 'npm install -g github-mcp',
      estimated_cost: 0.0000,
      estimated_latency_ms: 300,
      reliability_score: 0.95,
      routing_reason: 'Free for public repositories'
    },
    {
      name: 'openai-mcp',
      slug: 'openai-mcp',
      install_command: 'npm install -g openai-mcp',
      estimated_cost: 0.0150,
      estimated_latency_ms: 800,
      reliability_score: 0.99,
      routing_reason: 'Most reliable for AI tasks'
    },
    {
      name: 'filesystem-mcp',
      slug: 'filesystem-mcp',
      install_command: 'npm install -g filesystem-mcp',
      estimated_cost: 0.0000,
      estimated_latency_ms: 50,
      reliability_score: 1.00,
      routing_reason: 'Free and fastest for local files'
    },
    {
      name: 'stripe-mcp',
      slug: 'stripe-mcp',
      install_command: 'npm install -g stripe-mcp',
      estimated_cost: 0.0300,
      estimated_latency_ms: 200,
      reliability_score: 0.99,
      routing_reason: 'Enterprise-grade payment processing'
    }
  ];

  // Simple keyword matching for demo
  if (taskLower.includes('database') || taskLower.includes('sql') || taskLower.includes('postgres')) {
    return [mockServers[0], mockServers[3], mockServers[1]];
  } else if (taskLower.includes('github') || taskLower.includes('repo') || taskLower.includes('git')) {
    return [mockServers[1], mockServers[3], mockServers[0]];
  } else if (taskLower.includes('ai') || taskLower.includes('openai') || taskLower.includes('gpt')) {
    return [mockServers[2], mockServers[1], mockServers[3]];
  } else if (taskLower.includes('file') || taskLower.includes('read') || taskLower.includes('write')) {
    return [mockServers[3], mockServers[0], mockServers[1]];
  } else if (taskLower.includes('stripe') || taskLower.includes('payment') || taskLower.includes('charge')) {
    return [mockServers[4], mockServers[0], mockServers[2]];
  }

  return mockServers.slice(0, 3);
}
