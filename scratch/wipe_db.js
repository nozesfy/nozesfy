const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const tables = [
    'stock_movements',
    'products',
    'customers',
    'suppliers',
    'inventory_locations',
    'profiles',
    'organizations'
];

try {
    db.prepare("PRAGMA foreign_keys = OFF").run();
    for (const table of tables) {
        console.log(`Dropping table ${table}...`);
        try {
            db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
        } catch (e) {
            console.error(`Error dropping ${table}:`, e.message);
        }
    }
    // Drop indexes if they exist independently
    try {
        db.prepare("DROP INDEX IF EXISTS profiles_email_unique").run();
    } catch (e) {}
    
    console.log("Database wiped successfully!");
} catch (error) {
    console.error("Error wiping database:", error);
} finally {
    db.close();
}
