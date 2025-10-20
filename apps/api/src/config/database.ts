import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

// Create a singleton Prisma client
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: ["error"]
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"]
    });
  }
  prisma = global.__prisma;
}

// Test database connection on startup
prisma
  .$connect()
  .then(() => {
    logger.info("✅ Database connected successfully");
  })
  .catch((error) => {
    logger.error("❌ Database connection failed:", error);
    logger.info("💡 Make sure DATABASE_URL is set correctly");
  });

export default prisma;
