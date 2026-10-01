import { PrismaClient, Prisma } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaSchema?: string };

// Changes whenever a model or field is added/removed and `prisma generate` runs
const schemaFingerprint = JSON.stringify(
  Object.entries(Prisma).filter(([key]) => key === "ModelName" || key.endsWith("ScalarFieldEnum"))
);

function createPrismaClient() {
  // Use local database in development if not explicitly using Turso
  const useTurso = process.env.NODE_ENV === "production" || process.env.USE_TURSO === "true";

  if (useTurso) {
    const adapter = new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter });
  } else {
    // Use local SQLite for development
    const adapter = new PrismaLibSql({
      url: "file:./placeholder.db",
    });
    return new PrismaClient({ adapter });
  }
}

// In dev the client is cached across hot reloads; drop it if it was built from an older schema,
// otherwise new models (e.g. prisma.articleProgress) are undefined until the dev server restarts
export const prisma =
  globalForPrisma.prisma && globalForPrisma.prismaSchema === schemaFingerprint
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchema = schemaFingerprint;
}
