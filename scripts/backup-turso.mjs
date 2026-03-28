import "dotenv/config";
import { createClient } from "@libsql/client";
import { execSync } from "child_process";
import fs from "fs";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error("❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

async function backupTursoToLocal() {
  try {
    console.log("📥 Backing up Turso database to local...\n");

    const tursoClient = createClient({ url: tursoUrl, authToken: tursoToken });

    // Get all tables
    const result = await tursoClient.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );

    const tables = result.rows.map((row) => row.name);

    for (const tableName of tables) {
      console.log(`📋 Copying table: ${tableName}`);

      // Get all data from Turso
      const data = await tursoClient.execute(`SELECT * FROM ${tableName}`);

      if (data.rows.length === 0) {
        console.log(`   ✓ ${tableName}: 0 rows (empty)`);
        continue;
      }

      // Build SQL insert statements
      const columns = data.columns;
      const sqlLines = [`DELETE FROM ${tableName};`];

      for (const row of data.rows) {
        const values = columns.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
          return val;
        });

        const quotedColumns = columns.map((col) => `"${col}"`).join(", ");
        sqlLines.push(
          `INSERT INTO ${tableName} (${quotedColumns}) VALUES (${values.join(", ")});`
        );
      }

      // Write to temp file and execute
      const tempFile = `/tmp/backup_${tableName}_${Date.now()}.sql`;
      fs.writeFileSync(tempFile, sqlLines.join("\n"));

      try {
        execSync(`sqlite3 placeholder.db < ${tempFile}`, {
          stdio: "pipe",
        });
        fs.unlinkSync(tempFile);
        console.log(`   ✓ ${tableName}: ${data.rows.length} rows`);
      } catch (error) {
        console.error(
          `   ❌ Failed to insert into ${tableName}:`,
          error.message
        );
        fs.unlinkSync(tempFile);
        throw error;
      }
    }

    console.log("\n✅ Backup complete! Your production data is now in placeholder.db");
    console.log("🔄 Run 'npm run dev' to start using the app with your data");
  } catch (error) {
    console.error("❌ Error during backup:", error.message);
    process.exit(1);
  }
}

backupTursoToLocal();
