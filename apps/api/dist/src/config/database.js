"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
// Create a singleton Prisma client
let prisma;
if (process.env.NODE_ENV === "production") {
    prisma = new client_1.PrismaClient({
        log: ["error"]
    });
}
else {
    if (!global.__prisma) {
        global.__prisma = new client_1.PrismaClient({
            log: ["query", "info", "warn", "error"]
        });
    }
    prisma = global.__prisma;
}
// Test database connection on startup
prisma
    .$connect()
    .then(() => {
    logger_1.default.info("✅ Database connected successfully");
})
    .catch((error) => {
    logger_1.default.error("❌ Database connection failed:", error);
    logger_1.default.info("💡 Make sure DATABASE_URL is set correctly");
});
exports.default = prisma;
