import "dotenv/config";
import { createClient } from "@libsql/client";
import sqlite3 from "better-sqlite3";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

// Connect to Turso
const tursoClient = createClient({ url: tursoUrl, authToken: tursoToken });

// Connect to local SQLite
const localDb = new sqlite3("placeholder.db");

async function backupTursoToLocal() {
  try {
    console.log("📥 Backing up Turso database to local...\n");

    // Get all tables
    const tables = await tursoClient.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );

    for (const table of tables.rows) {
      const tableName = table[0];
      console.log(`Copying table: ${tableName}`);

      // Get table schema
      const schema = await tursoClient.execute(`PRAGMA table_info(${tableName})`);
      const columns = schema.rows.map((row) => row[1]).join(", ");

      // Get all data from Turso
      const data = await tursoClient.execute(`SELECT * FROM ${tableName}`);

      // Clear local table
      localDb.exec(`DELETE FROM ${tableName}`);

      // Insert data into local database
      if (data.rows.length > 0) {
        const placeholders = data.rows[0]
          .map(() => "?")
          .join(", ");
        const stmt = localDb.prepare(
          `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`
        );

        for (const row of data.rows) {
          stmt.run(...row);
        }
      }

      console.log(`✓ ${tableName}: ${data.rows.length} rows`);
    }

    console.log("\n✅ Backup complete!");
  } catch (error) {
    console.error("❌ Error during backup:", error.message);
    process.exit(1);
  }
}

backupTursoToLocal();
