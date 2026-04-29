const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
    const tableInfo = db.prepare("PRAGMA table_info(profiles)").all();
    console.log("Profiles Table Info:", JSON.stringify(tableInfo, null, 2));
    
    const columns = tableInfo.map(c => c.name);
    if (!columns.includes('password')) {
        console.log("Column 'password' is MISSING!");
    } else {
        console.log("Column 'password' EXISTS.");
    }

} catch (error) {
    console.error("Error checking database:", error);
} finally {
    db.close();
}
