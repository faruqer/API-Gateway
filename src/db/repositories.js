const { getDb } = require('./database');

const apiKeyRepo = {
  findByKey(key) {
    const db = getDb();
    return db.prepare('SELECT * FROM api_keys WHERE key = ? AND active = 1').get(key);
  },

  create(key, owner) {
    const db = getDb();
    return db.prepare('INSERT INTO api_keys (key, owner) VALUES (?, ?)').run(key, owner);
  },

  deactivate(key) {
    const db = getDb();
    return db.prepare('UPDATE api_keys SET active = 0 WHERE key = ?').run(key);
  },

  listAll() {
    const db = getDb();
    return db.prepare('SELECT id, key, owner, active, created_at FROM api_keys').all();
  },
};

const requestLogRepo = {
  insert(log) {
    const db = getDb();
    return db
      .prepare(
        `INSERT INTO request_logs (api_key, method, path, query, status_code, response_time_ms, ip, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        log.apiKey || null,
        log.method,
        log.path,
        log.query || null,
        log.statusCode,
        log.responseTimeMs,
        log.ip,
        log.error || null
      );
  },

  getRecent(limit = 50) {
    const db = getDb();
    return db
      .prepare('SELECT * FROM request_logs ORDER BY created_at DESC LIMIT ?')
      .all(limit);
  },
};

module.exports = { apiKeyRepo, requestLogRepo };
