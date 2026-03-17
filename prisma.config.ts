import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "file:./placeholder.db",
  },
  migrate: {
    async adapter() {
      return new PrismaLibSql({
        url: process.env["TURSO_DATABASE_URL"]!,
        authToken: process.env["TURSO_AUTH_TOKEN"],
      });
    },
  },
});
