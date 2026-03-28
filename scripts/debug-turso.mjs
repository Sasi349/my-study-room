import "dotenv/config";
import { createClient } from "@libsql/client";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const tursoClient = createClient({ url: tursoUrl, authToken: tursoToken });

const result = await tursoClient.execute("SELECT * FROM User LIMIT 1");

console.log("Result structure:", JSON.stringify(result, null, 2));
console.log("Columns:", result.columns);
console.log("Rows:", result.rows);
console.log("Row type:", typeof result.rows[0]);
console.log("Row content:", result.rows[0]);
