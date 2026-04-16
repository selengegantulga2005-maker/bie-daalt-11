// А.1 — Муу API (өөрчлөхгүй хуулбар)
// Анхны даалгавраас авсан, засвар хийгдээгүй.

class usr_mgr {
  constructor() {
    this.db_conn = null;          // public байх ёсгүй
    this.users_arr = [];          // public байх ёсгүй
  }

  // flag: 0=create, 1=update, 2=delete, 3=restore
  do_user_op(obj, flag, timeout) {
    // ...
  }

  // returns user as JSON string, or 'ERR_404' string if not found
  get_u(id_or_email, flag) {
    // ...
    return '';
  }

  find(q) {
    // throws SQLException
    return [];
  }
}

module.exports = { usr_mgr };
