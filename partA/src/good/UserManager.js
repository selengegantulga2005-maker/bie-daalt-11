/**
 * UserManager — хэрэглэгчийн менежментийн API.
 *
 * Зорилго: Хэрэглэгч үүсгэх, засах, устгах, хайх үйлдлүүдийг
 * нэгдсэн, тодорхой интерфейсээр гүйцэтгэнэ.
 */

// Алдааны класс — library өөрийнхөө exception ашиглана
class UserNotFoundError extends Error {
  constructor(identifier) {
    super(`User not found: ${identifier}`);
    this.name = 'UserNotFoundError';
    this.statusCode = 404;
  }
}

class UserValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserValidationError';
    this.statusCode = 400;
  }
}

class UserManager {
  /** @type {Map<string, object>} */
  #usersById;

  /** @type {Map<string, string>} email → id харгалзаа */
  #emailIndex;

  /**
   * UserManager үүсгэнэ.
   * @param {object} dbConnection — өгөгдлийн санд холболт
   */
  constructor(dbConnection) {
    if (!dbConnection) {
      throw new UserValidationError('dbConnection is required');
    }
    this.#usersById  = new Map();
    this.#emailIndex = new Map();
    // db_conn нь хувийн хадгалагдана — гадагш гарахгүй
    this._db = dbConnection;
  }

  // ─────────────────────────────────────────────
  // CRUD үйлдлүүд — тус бүр тусдаа метод (А.1 алдаа №3)
  // ─────────────────────────────────────────────

  /**
   * Шинэ хэрэглэгч үүсгэнэ.
   * @param {{ name: string, email: string }} userData
   * @returns {{ id: string, name: string, email: string }}
   * @throws {UserValidationError} name эсвэл email дутуу бол
   */
  createUser(userData) {
    this.#validateUserData(userData);
    const id = this.#generateId();
    const user = { id, name: userData.name, email: userData.email, deletedAt: null };
    this.#usersById.set(id, user);
    this.#emailIndex.set(userData.email, id);
    return this.#toPublic(user);
  }

  /**
   * Хэрэглэгчийн мэдээллийг шинэчилнэ.
   * @param {string} userId
   * @param {{ name?: string, email?: string }} updates
   * @returns {{ id: string, name: string, email: string }}
   * @throws {UserNotFoundError} хэрэглэгч олдохгүй бол
   */
  updateUser(userId, updates) {
    const user = this.#requireUser(userId);
    if (updates.name)  user.name  = updates.name;
    if (updates.email) {
      this.#emailIndex.delete(user.email);
      user.email = updates.email;
      this.#emailIndex.set(updates.email, userId);
    }
    return this.#toPublic(user);
  }

  /**
   * Хэрэглэгчийг зөөлөн устгана (soft delete).
   * @param {string} userId
   * @throws {UserNotFoundError} хэрэглэгч олдохгүй бол
   */
  deleteUser(userId) {
    const user = this.#requireUser(userId);
    user.deletedAt = new Date().toISOString();
  }

  /**
   * Устгагдсан хэрэглэгчийг сэргээнэ.
   * @param {string} userId
   * @returns {{ id: string, name: string, email: string }}
   * @throws {UserNotFoundError} хэрэглэгч олдохгүй бол
   */
  restoreUser(userId) {
    const user = this.#requireUser(userId);
    user.deletedAt = null;
    return this.#toPublic(user);
  }

  // ─────────────────────────────────────────────
  // Хайх үйлдлүүд
  // ─────────────────────────────────────────────

  /**
   * ID-аар хэрэглэгч авна.
   * @param {string} userId
   * @returns {{ id: string, name: string, email: string }}
   * @throws {UserNotFoundError}
   */
  getUserById(userId) {
    return this.#toPublic(this.#requireUser(userId));
  }

  /**
   * И-мэйлээр хэрэглэгч авна.
   * @param {string} email
   * @returns {{ id: string, name: string, email: string }}
   * @throws {UserNotFoundError}
   */
  getUserByEmail(email) {
    const id = this.#emailIndex.get(email);
    if (!id) throw new UserNotFoundError(email);
    return this.#toPublic(this.#requireUser(id));
  }

  /**
   * Хэрэглэгчдийг нэрээр хайна.
   * @param {string} query — хайх үг
   * @returns {Array<{ id: string, name: string, email: string }>}
   */
  searchUsers(query) {
    if (!query || typeof query !== 'string') {
      throw new UserValidationError('query must be a non-empty string');
    }
    const lower = query.toLowerCase();
    return [...this.#usersById.values()]
      .filter(u => !u.deletedAt && u.name.toLowerCase().includes(lower))
      .map(u => this.#toPublic(u));
  }

  // ─────────────────────────────────────────────
  // Хувийн тусламж методууд
  // ─────────────────────────────────────────────

  #requireUser(userId) {
    const user = this.#usersById.get(userId);
    if (!user) throw new UserNotFoundError(userId);
    return user;
  }

  #validateUserData(data) {
    if (!data || !data.name || !data.email) {
      throw new UserValidationError('name and email are required');
    }
    if (this.#emailIndex.has(data.email)) {
      throw new UserValidationError(`Email already exists: ${data.email}`);
    }
  }

  #toPublic(user) {
    return { id: user.id, name: user.name, email: user.email };
  }

  #generateId() {
    return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }
}

module.exports = { UserManager, UserNotFoundError, UserValidationError };
