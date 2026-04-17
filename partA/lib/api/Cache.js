const { Cache, CacheError, InvalidCacheKeyError, InvalidCapacityError } = require('./CacheBase');
const { LRUCache } = require('../impl/LRUCache');
const { LFUCache } = require('../impl/LFUCache');
const { TTLCache } = require('../impl/TTLCache');

class CacheFactory {
  static create(type, options = {}) {
    switch (type) {
      case 'lru': return new LRUCache(options.capacity ?? 100);
      case 'lfu': return new LFUCache(options.capacity ?? 100);
      case 'ttl': return new TTLCache(options.defaultTtlMs ?? 60_000);
      default:    throw new CacheError(`Unknown cache type: "${type}". Use 'lru', 'lfu', or 'ttl'.`);
    }
  }
}

module.exports = { Cache, CacheFactory, CacheError, InvalidCacheKeyError, InvalidCapacityError };
