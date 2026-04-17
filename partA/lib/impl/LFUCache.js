/**
 * LFUCache — Least Frequently Used cache хэрэгжилт.
 *
 * Хамгийн бага давтамжтай ашиглагдсан зүйлийг зайлуулна.
 * Давтамж тэнцүү бол хамгийн хуучинд ашиглагдсаныг зайлуулна (LRU tie-break).
 *
 * Алгоритм: freq→LinkedSet харгалзааны тусламжтай O(1) get/set.
 */

const { Cache, InvalidCacheKeyError, InvalidCapacityError } = require('../api/CacheBase');

class LFUCache extends Cache {
  #capacity;
  #minFreq;
  /** @type {Map<string, { value: *, freq: number }>} */
  #keyMap;
  /** @type {Map<number, Set<string>>} freq → insertion-ordered key set */
  #freqMap;

  /**
   * @param {number} capacity
   * @throws {InvalidCapacityError}
   */
  constructor(capacity) {
    super();
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new InvalidCapacityError(capacity);
    }
    this.#capacity = capacity;
    this.#minFreq   = 0;
    this.#keyMap    = new Map();
    this.#freqMap   = new Map();
  }

  /**
   * Утга хадгална.
   * @param {string} key
   * @param {*} value
   * @throws {InvalidCacheKeyError}
   */
  set(key, value) {
    this.#assertKey(key);
    if (this.#capacity === 0) return;

    if (this.#keyMap.has(key)) {
      this.#keyMap.get(key).value = value;
      this.#touch(key);
      return;
    }

    if (this.#keyMap.size >= this.#capacity) {
      this.#evict();
    }

    this.#keyMap.set(key, { value, freq: 1 });
    this.#addToFreq(1, key);
    this.#minFreq = 1;
  }

  /**
   * Утга авна.
   * @param {string} key
   * @returns {* | undefined}
   * @throws {InvalidCacheKeyError}
   */
  get(key) {
    this.#assertKey(key);
    if (!this.#keyMap.has(key)) return undefined;
    this.#touch(key);
    return this.#keyMap.get(key).value;
  }

  /** @param {string} key @returns {boolean} */
  has(key) {
    this.#assertKey(key);
    return this.#keyMap.has(key);
  }

  /** @param {string} key */
  delete(key) {
    this.#assertKey(key);
    if (!this.#keyMap.has(key)) return;
    const { freq } = this.#keyMap.get(key);
    this.#freqMap.get(freq)?.delete(key);
    this.#keyMap.delete(key);
  }

  clear() {
    this.#keyMap.clear();
    this.#freqMap.clear();
    this.#minFreq = 0;
  }

  get size() { return this.#keyMap.size; }

  // ── хувийн ──

  #touch(key) {
    const entry = this.#keyMap.get(key);
    const oldFreq = entry.freq;
    this.#freqMap.get(oldFreq).delete(key);
    if (this.#freqMap.get(oldFreq).size === 0 && oldFreq === this.#minFreq) {
      this.#minFreq++;
    }
    entry.freq++;
    this.#addToFreq(entry.freq, key);
  }

  #addToFreq(freq, key) {
    if (!this.#freqMap.has(freq)) this.#freqMap.set(freq, new Set());
    this.#freqMap.get(freq).add(key);
  }

  #evict() {
    const keys = this.#freqMap.get(this.#minFreq);
    const oldest = keys.values().next().value;
    keys.delete(oldest);
    this.#keyMap.delete(oldest);
  }

  #assertKey(key) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new InvalidCacheKeyError(key);
    }
  }
}

module.exports = { LFUCache };
