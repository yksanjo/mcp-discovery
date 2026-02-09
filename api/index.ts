import type { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown, ttlMs = 300000) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

// Generate embedding with timeout
async function generateEmbedding(text: string): Promise<number[]> {
  const cacheKey = `emb:${text.slice(0, 100)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached as number[];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const response = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: text.trim(),
      dimensions: 1536,
    });

    clearTimeout(timeout);
    const embedding = response.data[0].embedding;
    setCache(cacheKey, embedding, 3600000); // 1 hour
    return embedding;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// Semantic search
async function semanticSearch(query: string, limit = 5) {
  const embedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_servers', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: limit,
  });

  if (error) throw error;
  return data || [];
}

// Handlers
async function handleHealth(): Promise<object> {
  const { count } = await supabase
    .from('mcp_servers')
    .select('*', { count: 'exact', head: true });

  return {
    status: 'ok',
    service: 'mcp-discovery',
    version: '1.0.0',
    servers_count: count,
  };
}

async function handleDiscover(body: { need: string; limit?: number }): Promise<object> {
  const startTime = Date.now();
  const { need, limit = 5 } = body;

  if (!need) {
    throw new Error('Missing required field: need');
  }

  // Check cache
  const cacheKey = `search:${need}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return {
      ...(cached as object),
      query_time_ms: Date.now() - startTime,
      cached: true,
    };
  }

  try {
    const results = await semanticSearch(need, limit);

    const recommendations = results.map((server: any) => ({
      server: server.slug,
      name: server.name,
      npm_package: server.npm_package,
      install_command: server.install_command,
      confidence: Math.round(server.similarity * 100) / 100,
      description: server.description,
      category: server.category,
      github_url: server.github_url,
      docs_url: server.docs_url,
    }));

    const result = {
      recommendations,
      total_found: recommendations.length,
      query_time_ms: Date.now() - startTime,
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    // Fallback to text search if semantic search fails
    const { data } = await supabase
      .from('mcp_servers')
      .select('name, slug, npm_package, install_command, description, category, github_url, docs_url')
      .or(`name.ilike.%${need}%,description.ilike.%${need}%`)
      .limit(limit);

    const recommendations = (data || []).map((server: any) => ({
      server: server.slug,
      name: server.name,
      npm_package: server.npm_package,
      install_command: server.install_command,
      confidence: 0.5,
      description: server.description,
      category: server.category,
      github_url: server.github_url,
      docs_url: server.docs_url,
    }));

    return {
      recommendations,
      total_found: recommendations.length,
      query_time_ms: Date.now() - startTime,
      fallback: true,
    };
  }
}

async function handleGetServer(slug: string): Promise<object> {
  const { data, error } = await supabase
    .from('mcp_servers')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    throw new Error(`Server not found: ${slug}`);
  }

  return data;
}

async function handleListServers(category?: string, limit = 20): Promise<object> {
  let query = supabase
    .from('mcp_servers')
    .select('name, slug, description, category, install_command')
    .limit(limit);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;

  return { servers: data, count: data?.length || 0 };
}

async function handleCategories(): Promise<object> {
  const { data, error } = await supabase
    .from('mcp_servers')
    .select('category');

  if (error) throw error;

  const counts: Record<string, number> = {};
  data?.forEach((row: { category: string }) => {
    counts[row.category] = (counts[row.category] || 0) + 1;
  });

  return {
    categories: Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // Health check
    if (path === '/' || path === '/health') {
      const result = await handleHealth();
      return res.status(200).json(result);
    }

    // Discover endpoint
    if (path === '/api/v1/discover' && req.method === 'POST') {
      const result = await handleDiscover(req.body);
      return res.status(200).json(result);
    }

    // Get server by slug
    if (path.startsWith('/api/v1/servers/') && req.method === 'GET') {
      const slug = path.split('/').pop();
      if (slug) {
        const result = await handleGetServer(slug);
        return res.status(200).json(result);
      }
    }

    // List servers
    if (path === '/api/v1/servers' && req.method === 'GET') {
      const category = url.searchParams.get('category') || undefined;
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const result = await handleListServers(category, limit);
      return res.status(200).json(result);
    }

    // Categories
    if (path === '/api/v1/categories' && req.method === 'GET') {
      const result = await handleCategories();
      return res.status(200).json(result);
    }

    // Pricing info
    if (path === '/api/v1/pricing') {
      return res.status(200).json({
        tiers: {
          free: { price: 0, queries_per_month: 100, features: ['Basic discovery', 'Server info'] },
          pro: { price: 29, queries_per_month: 10000, features: ['All free features', 'Metrics', 'Priority support'] },
          enterprise: { price: 'custom', queries_per_month: 'unlimited', features: ['All pro features', 'SLA', 'Custom integrations'] },
        },
      });
    }

    // ==================== MCP CURATOR ROUTES ====================
    
    // MCP Curator health check
    if (path === '/api/v1/curator/health' && req.method === 'GET') {
      try {
        const { error } = await supabase.from('mcp_servers').select('count', { count: 'exact', head: true });
        
        if (error) {
          return res.status(500).json({ 
            status: 'unhealthy',
            error: 'Database connection failed',
            details: error.message
          });
        }

        return res.status(200).json({
          status: 'healthy',
          service: 'MCP Curator API',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return res.status(500).json({
          status: 'unhealthy',
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // MCP Curator route endpoint (public demo)
    if (path === '/api/v1/curator/recommend' && req.method === 'POST') {
      try {
        const { task } = req.body;
        
        if (!task) {
          return res.status(400).json({ error: 'Task description is required' });
        }

        // For demo, return mock data
        const recommendations = getMockRecommendations(task);
        
        return res.status(200).json({
          recommendations,
          note: 'Demo mode - using mock data. Get API key for real routing.'
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(400).json({ error: message });
      }
    }

    // 404
    return res.status(404).json({ error: 'Not found', path });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
}

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
