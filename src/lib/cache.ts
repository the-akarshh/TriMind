/**
 * ==============================================================================
 * APTITUDE ARENA — HIGH-PERFORMANCE IN-MEMORY TTL CACHE
 * Ultra-fast cache with expiration timestamps and memory management
 * ==============================================================================
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}

export class ArenaMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalSeconds = 60) {
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        this.purgeExpired();
      }, cleanupIntervalSeconds * 1000);
      // Unref to avoid preventing process exit
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  public set<T>(key: string, value: T, ttlSeconds = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  public get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.evictions++;
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  public has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.evictions++;
      return false;
    }
    return true;
  }

  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public purgeExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        count++;
        this.evictions++;
      }
    }
    return count;
  }

  public getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      evictions: this.evictions,
    };
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Global cache instance
export const memoryCache = new ArenaMemoryCache();
