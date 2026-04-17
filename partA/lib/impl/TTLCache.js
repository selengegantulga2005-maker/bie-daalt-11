/**
 * TTLCache — Time-To-Live cache хэрэгжилт.
 *
 * Зүйл бүр хугацааны хязгаартай. Хугацаа дуусвал get() undefined буцаана.
 * Дотоод цэвэрлэгч таймер автоматаар дуусагдсан зүйлсийг устгана.
 */

const { Cache, InvalidCacheKeyError, InvalidCapacityError } = require('../api/CacheBase');

class TTLCache extends Cache {
  /** @type {Map<string, { value: *, expiresAt: number }>} */
  #store;
  /** @type {number} мс */
  #defaultTtlMs;
  /** @type {NodeJS.Timeout} */
  #cleanupTimer;

  /**
   * @param {number} defaultTtlMs — хэрэглэгч ttl өгөхгүй бол ашиглах анхны утга (мс, >0)
   * @param {number} [cleanupIntervalMs=60000] — дуусагдсан зүйлсийг хэр давтамжтай цэвэрлэх
   * @throws {InvalidCapacityError} defaultTtlMs буруу бол
   */
  constructor(defaultTtlMs, cleanupIntervalMs = 60_000) {
    super();
    if (!Number.isFinite(defaultTtlMs) || defaultTtlMs <= 0) {
      throw new InvalidCapacityError(defaultTtlMs);
    }
    this.#defaultTtlMs = defaultTtlMs;
    this.#store        = new Map();
    // Автомат цэвэрлэгч — санах ойг чөлөөлнө
    this.#cleanupTimer = setInterval(() => this.#cleanup(), cleanupIntervalMs).unref();
  }

  /**
   * Утга хадгална.
   * @param {string} key
   * @param {*} value
   * @param {number} [ttlMs] — энэ оруулгын TTL мс-ээр; өгөхгүй бол defaultTtlMs
   * @throws {InvalidCacheKeyError}
   */
  set(key, value, ttlMs) {
    this.#assertKey(key);
    const ttl = (ttlMs != null && Number.isFinite(ttlMs) && ttlMs > 0)
      ? ttlMs
      : this.#defaultTtlMs;
    this.#store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  /**
   * Утга авна. Хугацаа дуусгавар болсон зүйлийг устгаж undefined буцаана.
   * @param {string} key
   * @returns {* | undefined}
   * @throws {InvalidCacheKeyError}
   */
  get(key) {
    this.#assertKey(key);
    const entry = this.#store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.#store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Хугацаа дуусаагүй эсэхийг шалгана.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    this.#assertKey(key);
    const entry = this.#store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.#store.delete(key);
      return false;
    }
    return true;
  }

  /** @param {string} key */
  delete(key) {
    this.#assertKey(key);
    this.#store.delete(key);
  }

  clear() { this.#store.clear(); }

  /** Зөвхөн хугацаа дуусаагүй зүйлсийн тоо. */
  get size() {
    this.#cleanup();
    return this.#store.size;
  }

  /**
   * Таймерийг зогсооно — process эсвэл test дуусахад дуудна.
   */
  destroy() {
    clearInterval(this.#cleanupTimer);
  }

  // ── хувийн ──

  #cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.#store) {
      if (now > entry.expiresAt) this.#store.delete(key);
    }
  }

  #assertKey(key) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new InvalidCacheKeyError(key);
    }
  }
}

module.exports = { TTLCache };
