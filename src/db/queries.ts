import { getSupabaseClient } from './client.js';
import type {
  MCPServer,
  MatchedServer,
  Metrics,
  Capability,
} from '../types/index.js';

const supabase = () => getSupabaseClient();

// Server CRUD operations

export async function getServerBySlug(slug: string): Promise<MCPServer | null> {
  const { data, error } = await supabase()
    .from('mcp_servers')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get server: ${error.message}`);
  }

  return data;
}

export async function getServerById(id: string): Promise<MCPServer | null> {
  const { data, error } = await supabase()
    .from('mcp_servers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get server: ${error.message}`);
  }

  return data;
}

export async function getServerBySlugOrId(
  identifier: string
): Promise<MCPServer | null> {
  // Try UUID first (if it looks like a UUID)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(identifier)) {
    return getServerById(identifier);
  }
  return getServerBySlug(identifier);
}

export async function getServersByIds(ids: string[]): Promise<MCPServer[]> {
  const { data, error } = await supabase()
    .from('mcp_servers')
    .select('*')
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to get servers: ${error.message}`);
  }

  return data || [];
}

export async function getServersBySlugs(slugs: string[]): Promise<MCPServer[]> {
  const { data, error } = await supabase()
    .from('mcp_servers')
    .select('*')
    .in('slug', slugs);

  if (error) {
    throw new Error(`Failed to get servers: ${error.message}`);
  }

  return data || [];
}

export async function getAllServers(): Promise<MCPServer[]> {
  const { data, error } = await supabase()
    .from('mcp_servers')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(`Failed to get servers: ${error.message}`);
  }

  return data || [];
}

export async function getServersWithoutEmbeddings(): Promise<MCPServer[]> {
  const { data, error } = await supabase()
    .from('mcp_servers')
    .select('*')
    .is('description_embedding', null);

  if (error) {
    throw new Error(`Failed to get servers: ${error.message}`);
  }

  return data || [];
}

export async function insertServer(
  server: Omit<MCPServer, 'id' | 'created_at' | 'updated_at'>
): Promise<MCPServer> {
  const { data, error } = await supabase()
    .from('mcp_servers')
    .insert(server)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert server: ${error.message}`);
  }

  return data;
}

export async function updateServerEmbedding(
  id: string,
  embedding: number[]
): Promise<void> {
  const { error } = await supabase()
    .from('mcp_servers')
    .update({ description_embedding: embedding })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update embedding: ${error.message}`);
  }
}

export async function upsertServer(
  server: Omit<MCPServer, 'id' | 'created_at' | 'updated_at'>
): Promise<MCPServer> {
  const { data, error } = await supabase()
    .from('mcp_servers')
    .upsert(server, { onConflict: 'slug' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert server: ${error.message}`);
  }

  return data;
}

// Semantic search

export async function searchServersByEmbedding(
  embedding: number[],
  limit: number = 5,
  threshold: number = 0.3
): Promise<MatchedServer[]> {
  const { data, error } = await supabase().rpc('match_servers', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    throw new Error(`Failed to search servers: ${error.message}`);
  }

  return data || [];
}

// Capabilities

export async function getCapabilitiesForServer(
  serverId: string
): Promise<Capability[]> {
  const { data, error } = await supabase()
    .from('server_capabilities')
    .select('capabilities(*)')
    .eq('server_id', serverId);

  if (error) {
    throw new Error(`Failed to get capabilities: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data?.map((item: any) => item.capabilities as Capability) || [];
}

export async function getCapabilityByName(
  name: string
): Promise<Capability | null> {
  const { data, error } = await supabase()
    .from('capabilities')
    .select('*')
    .eq('name', name)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get capability: ${error.message}`);
  }

  return data;
}

export async function insertCapability(
  capability: Omit<Capability, 'id' | 'created_at'>
): Promise<Capability> {
  const { data, error } = await supabase()
    .from('capabilities')
    .insert(capability)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert capability: ${error.message}`);
  }

  return data;
}

export async function upsertCapability(
  capability: Omit<Capability, 'id' | 'created_at'>
): Promise<Capability> {
  const { data, error } = await supabase()
    .from('capabilities')
    .upsert(capability, { onConflict: 'name' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert capability: ${error.message}`);
  }

  return data;
}

export async function linkServerCapability(
  serverId: string,
  capabilityId: string
): Promise<void> {
  const { error } = await supabase()
    .from('server_capabilities')
    .upsert({ server_id: serverId, capability_id: capabilityId });

  if (error) {
    throw new Error(`Failed to link capability: ${error.message}`);
  }
}

// Metrics

export async function getLatestMetrics(
  serverId: string
): Promise<Metrics | null> {
  const { data, error } = await supabase()
    .from('metrics')
    .select('*')
    .eq('server_id', serverId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get metrics: ${error.message}`);
  }

  return data;
}

export async function getMetricsHistory(
  serverId: string,
  hours: number = 24
): Promise<Metrics[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase()
    .from('metrics')
    .select('*')
    .eq('server_id', serverId)
    .gte('timestamp', since)
    .order('timestamp', { ascending: true });

  if (error) {
    throw new Error(`Failed to get metrics history: ${error.message}`);
  }

  return data || [];
}

export async function insertMetrics(
  metrics: Omit<Metrics, 'id' | 'timestamp'>
): Promise<Metrics> {
  const { data, error } = await supabase()
    .from('metrics')
    .insert(metrics)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert metrics: ${error.message}`);
  }

  return data;
}

// Bulk operations for seeding

export async function bulkInsertServers(
  servers: Omit<MCPServer, 'id' | 'created_at' | 'updated_at'>[]
): Promise<MCPServer[]> {
  const { data, error } = await supabase()
    .from('mcp_servers')
    .upsert(servers, { onConflict: 'slug' })
    .select();

  if (error) {
    throw new Error(`Failed to bulk insert servers: ${error.message}`);
  }

  return data || [];
}
