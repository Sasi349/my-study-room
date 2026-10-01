// Creates the ArticleMember + ArticleProgress tables (Menu → Articles checklist).
// Usage: node scripts/add-article-tables.mjs           # Turso (production)
//        node scripts/add-article-tables.mjs --local   # placeholder.db (local dev)
import "dotenv/config";
import { createClient } from "@libsql/client";

const local = process.argv.includes("--local");
const client = local
  ? createClient({ url: "file:./placeholder.db" })
  : createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

async function columns(table) {
  const res = await client.execute(`PRAGMA table_info(${table});`);
  return res.rows.map((r) => r.name);
}

async function main() {
  console.log("Target:", local ? "placeholder.db" : process.env.TURSO_DATABASE_URL);

  await client.execute(`CREATE TABLE IF NOT EXISTS "ArticleMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`);

  // The first version of ArticleProgress was keyed by userId; replace it if it holds no data
  const existing = await columns("ArticleProgress");
  if (existing.includes("userId")) {
    const { rows } = await client.execute('SELECT COUNT(*) AS n FROM "ArticleProgress";');
    if (Number(rows[0].n) > 0) {
      throw new Error(`ArticleProgress (old userId shape) has ${rows[0].n} rows; migrate them manually first`);
    }
    await client.execute('DROP TABLE "ArticleProgress";');
    console.log("Dropped empty ArticleProgress (old userId shape)");
  }

  await client.execute(`CREATE TABLE IF NOT EXISTS "ArticleProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleProgress_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ArticleMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`);
  await client.execute(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ArticleProgress_memberId_articleId_key" ON "ArticleProgress"("memberId", "articleId");'
  );

  console.log("ArticleMember columns:", (await columns("ArticleMember")).join(", "));
  console.log("ArticleProgress columns:", (await columns("ArticleProgress")).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
