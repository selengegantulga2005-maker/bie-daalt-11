class Cache {
  set(key, value, ttlMs) { throw new Error('Not implemented'); }
  get(key) { throw new Error('Not implemented'); }
  has(key) { throw new Error('Not implemented'); }
  delete(key) { throw new Error('Not implemented'); }
  clear() { throw new Error('Not implemented'); }
  get size() { throw new Error('Not implemented'); }
}

class CacheError extends Error {
  constructor(message) { super(message); this.name = 'CacheError'; }
}
class InvalidCacheKeyError extends CacheError {
  constructor(key) { super(`Invalid cache key: "${key}". Key must be a non-empty string.`); this.name = 'InvalidCacheKeyError'; }
}
class InvalidCapacityError extends CacheError {
  constructor(capacity) { super(`Invalid capacity: ${capacity}. Must be a positive number.`); this.name = 'InvalidCapacityError'; }
}

module.exports = { Cache, CacheError, InvalidCacheKeyError, InvalidCapacityError };
