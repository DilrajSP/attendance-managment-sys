import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

// ---- SSL CERT HANDLING ----
const caPath = path.join(process.cwd(), "ca.pem");
const hasCa = fs.existsSync(caPath);

// 🔍 this log is IMPORTANT (you already saw this fix things)
console.log("🔐 ca.pem exists:", hasCa);

const sslConfig = hasCa
  ? {
      ssl: {
        ca: fs.readFileSync(caPath, "utf8"),
        rejectUnauthorized: true,
      },
    }
  : undefined;

// ---- PRISMA GLOBAL CACHING ----
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// ---- PG ADAPTER WITH SSL ----
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ...(sslConfig ?? {}),
});

// ---- PRISMA CLIENT ----
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
