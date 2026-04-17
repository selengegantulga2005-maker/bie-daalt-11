/**
 * Cache сангийн unit тест.
 * Ажиллуулах: node --test partA/test/cache.test.js
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { CacheFactory, CacheError, InvalidCacheKeyError, InvalidCapacityError } = require('../lib/api/Cache');

// ═══════════════════════════════════════════════
// CacheFactory тест
// ═══════════════════════════════════════════════

describe('CacheFactory', () => {
  it('lru cache үүсгэнэ', () => {
    const cache = CacheFactory.create('lru', { capacity: 10 });
    assert.ok(cache);
  });

  it('lfu cache үүсгэнэ', () => {
    const cache = CacheFactory.create('lfu', { capacity: 10 });
    assert.ok(cache);
  });

  it('ttl cache үүсгэнэ', () => {
    const cache = CacheFactory.create('ttl', { defaultTtlMs: 5000 });
    assert.ok(cache);
    cache.destroy();
  });

  it('тодорхойгүй type-д CacheError өгнө', () => {
    assert.throws(() => CacheFactory.create('xyz'), CacheError);
  });
});

// ═══════════════════════════════════════════════
// LRU Cache тест
// ═══════════════════════════════════════════════

describe('LRUCache', () => {
  it('set/get үндсэн үйлдэл', () => {
    const c = CacheFactory.create('lru', { capacity: 3 });
    c.set('a', 1);
    assert.equal(c.get('a'), 1);
  });

  it('байхгүй key-д undefined буцаана', () => {
    const c = CacheFactory.create('lru', { capacity: 3 });
    assert.equal(c.get('missing'), undefined);
  });

  it('capacity дүүрмэгц хамгийн хуучин зүйлийг зайлуулна', () => {
    const c = CacheFactory.create('lru', { capacity: 2 });
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);          // 'a' зайлуулагдана
    assert.equal(c.get('a'), undefined);
    assert.equal(c.get('b'), 2);
    assert.equal(c.get('c'), 3);
  });

  it('get дуудсаны дараа тухайн зүйл "шинэ" болно (evict-ийн дараалал өөрчлөгдөнө)', () => {
    const c = CacheFactory.create('lru', { capacity: 2 });
    c.set('a', 1);
    c.set('b', 2);
    c.get('a');             // 'a' нь одоо "шинэ"
    c.set('c', 3);          // 'b' зайлуулагдана
    assert.equal(c.get('a'), 1);
    assert.equal(c.get('b'), undefined);
  });

  it('delete ажиллана', () => {
    const c = CacheFactory.create('lru', { capacity: 3 });
    c.set('a', 1);
    c.delete('a');
    assert.equal(c.has('a'), false);
  });

  it('clear бүгдийг устгана', () => {
    const c = CacheFactory.create('lru', { capacity: 3 });
    c.set('a', 1); c.set('b', 2);
    c.clear();
    assert.equal(c.size, 0);
  });

  it('хоосон key-д InvalidCacheKeyError', () => {
    const c = CacheFactory.create('lru', { capacity: 3 });
    assert.throws(() => c.set('', 1), InvalidCacheKeyError);
  });

  it('capacity 0 бол InvalidCapacityError', () => {
    assert.throws(() => CacheFactory.create('lru', { capacity: 0 }), InvalidCapacityError);
  });
});

// ═══════════════════════════════════════════════
// LFU Cache тест
// ═══════════════════════════════════════════════

describe('LFUCache', () => {
  it('set/get үндсэн үйлдэл', () => {
    const c = CacheFactory.create('lfu', { capacity: 3 });
    c.set('x', 42);
    assert.equal(c.get('x'), 42);
  });

  it('хамгийн бага давтамжтайг зайлуулна', () => {
    const c = CacheFactory.create('lfu', { capacity: 2 });
    c.set('a', 1);
    c.set('b', 2);
    c.get('a');   // 'a' freq=2, 'b' freq=1
    c.set('c', 3); // 'b' зайлуулагдана
    assert.equal(c.get('b'), undefined);
    assert.equal(c.get('a'), 1);
    assert.equal(c.get('c'), 3);
  });

  it('утга шинэчлэхэд freq хадгалагдана', () => {
    const c = CacheFactory.create('lfu', { capacity: 2 });
    c.set('a', 1);
    c.get('a'); c.get('a'); // freq=3
    c.set('a', 99); // шинэчлэл, freq үргэлжлэх ёстой
    assert.equal(c.get('a'), 99);
  });

  it('size зөв тооцно', () => {
    const c = CacheFactory.create('lfu', { capacity: 5 });
    c.set('a', 1); c.set('b', 2);
    assert.equal(c.size, 2);
  });
});

// ═══════════════════════════════════════════════
// TTL Cache тест
// ═══════════════════════════════════════════════

describe('TTLCache', () => {
  let cache;
  before(() => { cache = CacheFactory.create('ttl', { defaultTtlMs: 100 }); });
  after(() => { cache.destroy(); });

  it('set/get үндсэн үйлдэл', () => {
    cache.set('hello', 'world');
    assert.equal(cache.get('hello'), 'world');
  });

  it('хугацаа дуусвал undefined буцаана', async () => {
    cache.set('temp', 'data', 50);
    await new Promise(r => setTimeout(r, 80));
    assert.equal(cache.get('temp'), undefined);
  });

  it('has() хугацаа дуусаагүй зүйлд true', () => {
    cache.set('alive', 1, 5000);
    assert.equal(cache.has('alive'), true);
  });

  it('has() хугацаа дуусагдсан зүйлд false', async () => {
    cache.set('dead', 1, 30);
    await new Promise(r => setTimeout(r, 60));
    assert.equal(cache.has('dead'), false);
  });

  it('тусдаа ttl өгч болно', async () => {
    cache.set('long', 'value', 10_000);
    await new Promise(r => setTimeout(r, 50));
    assert.equal(cache.get('long'), 'value');
  });
});
