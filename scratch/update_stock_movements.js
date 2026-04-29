const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
  console.log('Adding target_location_id to stock_movements...');
  try {
    db.prepare('ALTER TABLE stock_movements ADD COLUMN target_location_id TEXT').run();
    console.log('Column target_location_id added successfully.');
  } catch (e) {
    console.log('Column might already exist or error:', e.message);
  }
} catch (error) {
  console.error('Fatal error updating database:', error);
} finally {
  db.close();
}
