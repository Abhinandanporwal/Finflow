import { PrismaClient } from "@prisma/client";

// Reuse the Prisma client across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db: PrismaClient = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

// Explanation:
// Using a global variable ensures that in development, where modules may reload frequently,
// we reuse the same PrismaClient instance instead of creating a new one on every reload,
// avoiding multiple connections and potential errors.
