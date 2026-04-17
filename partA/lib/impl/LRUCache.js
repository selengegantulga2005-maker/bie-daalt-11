/**
 * LRUCache — Least Recently Used cache хэрэгжилт.
 *
 * Хамгийн сүүлд ашиглагдаагүй зүйлийг хамгийн түрүүнд зайлуулна.
 * Map-ийн insertion-order шинжийг ашиглан O(1) get/set хэрэгжүүлнэ.
 */

const { Cache, InvalidCacheKeyError, InvalidCapacityError } = require('../api/CacheBase');

class LRUCache extends Cache {
  /** @type {Map<string, *>} */
  #store;
  /** @type {number} */
  #capacity;

  /**
   * @param {number} capacity — хамгийн их зүйлсийн тоо (>0)
   * @throws {InvalidCapacityError}
   */
  constructor(capacity) {
    super();
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new InvalidCapacityError(capacity);
    }
    this.#capacity = capacity;
    this.#store    = new Map();
  }

  /**
   * Утга хадгална. Capacity дүүрсэн бол хамгийн хуучин зүйлийг хасна.
   * @param {string} key
   * @param {*} value
   * @throws {InvalidCacheKeyError}
   */
  set(key, value) {
    this.#assertKey(key);
    if (this.#store.has(key)) {
      this.#store.delete(key);   // position-г шинэчлэхийн тулд устгаад дахин нэм
    } else if (this.#store.size >= this.#capacity) {
      // Map-ийн эхний оруулгыг (хамгийн хуучинд ашиглагдсан) устгана
      this.#store.delete(this.#store.keys().next().value);
    }
    this.#store.set(key, value);
  }

  /**
   * Утга авна. Авсны дараа тухайн зүйлийг "сүүлд ашиглагдсан" болгоно.
   * @param {string} key
   * @returns {* | undefined}
   * @throws {InvalidCacheKeyError}
   */
  get(key) {
    this.#assertKey(key);
    if (!this.#store.has(key)) return undefined;
    const value = this.#store.get(key);
    // LRU дарааллыг шинэчлэх
    this.#store.delete(key);
    this.#store.set(key, value);
    return value;
  }

  /** @param {string} key @returns {boolean} */
  has(key) {
    this.#assertKey(key);
    return this.#store.has(key);
  }

  /** @param {string} key */
  delete(key) {
    this.#assertKey(key);
    this.#store.delete(key);
  }

  clear() { this.#store.clear(); }

  get size() { return this.#store.size; }

  get capacity() { return this.#capacity; }

  // ── хувийн ──
  #assertKey(key) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new InvalidCacheKeyError(key);
    }
  }
}

module.exports = { LRUCache };
