const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
  // Check if organization_invites exists
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='organization_invites'").get();
  
  if (!tableCheck) {
    console.log('Creating organization_invites table...');
    db.prepare(`
      CREATE TABLE organization_invites (
        id text PRIMARY KEY NOT NULL,
        organization_id text NOT NULL,
        email text NOT NULL,
        role text NOT NULL,
        location_id text,
        status text DEFAULT 'pending' NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (location_id) REFERENCES inventory_locations(id)
      )
    `).run();
  }

  // Add missing columns to customers
  try {
    db.prepare('ALTER TABLE customers ADD COLUMN address TEXT').run();
    console.log('Added address to customers');
  } catch (e) { console.log('address already exists in customers or error:', e.message); }

  try {
    db.prepare('ALTER TABLE customers ADD COLUMN cpf_cnpj TEXT').run();
    console.log('Added cpf_cnpj to customers');
  } catch (e) { console.log('cpf_cnpj already exists in customers or error:', e.message); }

  try {
    db.prepare('ALTER TABLE customers ADD COLUMN type TEXT').run();
    console.log('Added type to customers');
  } catch (e) { console.log('type already exists in customers or error:', e.message); }

  // Add missing columns to suppliers
  try {
    db.prepare('ALTER TABLE suppliers ADD COLUMN cnpj TEXT').run();
    console.log('Added cnpj to suppliers');
  } catch (e) { console.log('cnpj already exists in suppliers or error:', e.message); }

  try {
    db.prepare('ALTER TABLE suppliers ADD COLUMN category TEXT').run();
    console.log('Added category to suppliers');
  } catch (e) { console.log('category already exists in suppliers or error:', e.message); }

  console.log('Database sync complete!');
} catch (error) {
  console.error('Fatal error updating database:', error);
} finally {
  db.close();
}
