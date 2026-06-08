const { getDb } = require('./database');
const { v4: uuidv4 } = require('uuid');

function seed() {
  const db = getDb();

  const existing = db.prepare('SELECT COUNT(*) as count FROM api_keys').get();
  if (existing.count > 0) {
    console.log('Database already seeded. Existing API keys:');
    const keys = db.prepare('SELECT key, owner, active FROM api_keys').all();
    keys.forEach((k) => console.log(`  [${k.active ? 'active' : 'inactive'}] ${k.owner}: ${k.key}`));
    return;
  }

  const testKey = uuidv4();
  const demoKey = uuidv4();

  const insert = db.prepare('INSERT INTO api_keys (key, owner) VALUES (?, ?)');
  insert.run(testKey, 'test-user');
  insert.run(demoKey, 'demo-user');

  console.log('Database seeded successfully!');
  console.log(`  test-user API key: ${testKey}`);
  console.log(`  demo-user API key: ${demoKey}`);
}

seed();
process.exit(0);
