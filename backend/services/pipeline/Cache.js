/**
 * Chunk-Level Cache
 *
 * In-memory LRU cache keyed by hash(chunkText + methodId + settings).
 * Avoids redundant AI calls when identical chunks are processed
 * with the same method and configuration.
 */

const crypto = require('crypto');
const config = require('../../config/pipeline');
const Logger = require('./Logger');

class Cache {
  constructor() {
    this.store = new Map();
    this.maxEntries = config.cache.maxEntries;
    this.ttlMs = config.cache.ttlMs;
    this.enabled = config.cache.enabled;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Generate a deterministic cache key from chunk content + method context.
   */
  _makeKey(text, methodId, stageName) {
    const raw = `${methodId}:${stageName}:${text}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Get a cached result if it exists and hasn't expired.
   */
  get(text, methodId, stageName) {
    if (!this.enabled) return null;

    const key = this._makeKey(text, methodId, stageName);
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    Logger.debug('Cache', `HIT for ${stageName}`, { methodId, hits: this.hits });
    return entry.value;
  }

  /**
   * Store a result in the cache.
   */
  set(text, methodId, stageName, value) {
    if (!this.enabled) return;

    const key = this._makeKey(text, methodId, stageName);

    // Evict oldest entry if at capacity
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cache statistics.
   */
  stats() {
    return {
      entries: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(1) + '%'
        : '0%',
    };
  }

  /**
   * Clear all cached entries.
   */
  clear() {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

// Singleton instance
module.exports = new Cache();
