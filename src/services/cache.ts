/**
 * In-Memory LRU Cache for MCP Discovery
 * Provides fast caching without external dependencies
 */

interface CacheEntry<T> {
  value: T;
  expires: number;
}

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(maxSize = 1000, defaultTTLMs = 300000) { // 5 min default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTLMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + (ttlMs ?? this.defaultTTL),
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  prune(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [key, entry] of this.cache) {
      if (now > entry.expires) {
        this.cache.delete(key);
        pruned++;
      }
    }
    return pruned;
  }
}

// Cache instances
const searchCache = new LRUCache<unknown>(500, 300000);      // 5 min TTL
const embeddingCache = new LRUCache<number[]>(200, 3600000); // 1 hour TTL
const serverCache = new LRUCache<unknown>(1000, 600000);     // 10 min TTL
const categoryCache = new LRUCache<unknown>(50, 900000);     // 15 min TTL

// Hash function for cache keys
function hashKey(obj: unknown): string {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Search cache
export function getCachedSearch(query: string, options: unknown): unknown | null {
  const key = `search:${hashKey({ query, options })}`;
  return searchCache.get(key);
}

export function setCachedSearch(query: string, options: unknown, result: unknown): void {
  const key = `search:${hashKey({ query, options })}`;
  searchCache.set(key, result);
}

// Embedding cache
export function getCachedEmbedding(text: string): number[] | null {
  const key = `emb:${hashKey(text)}`;
  return embeddingCache.get(key);
}

export function setCachedEmbedding(text: string, embedding: number[]): void {
  const key = `emb:${hashKey(text)}`;
  embeddingCache.set(key, embedding);
}

// Server cache
export function getCachedServer(identifier: string): unknown | null {
  return serverCache.get(`server:${identifier}`);
}

export function setCachedServer(identifier: string, server: unknown): void {
  serverCache.set(`server:${identifier}`, server);
}

// Category cache
export function getCachedCategory(category: string): unknown | null {
  return categoryCache.get(`cat:${category}`);
}

export function setCachedCategory(category: string, servers: unknown): void {
  categoryCache.set(`cat:${category}`, servers);
}

// Stats
export function getCacheStats() {
  return {
    search: searchCache.size(),
    embeddings: embeddingCache.size(),
    servers: serverCache.size(),
    categories: categoryCache.size(),
  };
}

// Prune all caches
export function pruneAllCaches(): number {
  return (
    searchCache.prune() +
    embeddingCache.prune() +
    serverCache.prune() +
    categoryCache.prune()
  );
}

// Clear all caches
export function clearAllCaches(): void {
  searchCache.clear();
  embeddingCache.clear();
  serverCache.clear();
  categoryCache.clear();
}

// Auto-prune every 5 minutes
setInterval(() => {
  pruneAllCaches();
}, 300000);
