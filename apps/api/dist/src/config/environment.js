"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.getBoolean = exports.getNumber = exports.env = void 0;
const zod_1 = require("zod");
// Environment validation schema
const envSchema = zod_1.z.object({
    ADMIN_PASSWORD: zod_1.z.string().min(8),
    // Admin Configuration
    ADMIN_USERNAME: zod_1.z.string().default("admin"),
    // Analytics Configuration
    ANALYTICS_ENABLED: zod_1.z.string().default("true"),
    ANALYTICS_RETENTION_DAYS: zod_1.z.string().default("90"),
    // Blockchain Configuration
    ARBISCAN_API_KEY: zod_1.z
        .string()
        .optional()
        .default("68VNDTYKGYFHYACCY35W4XSWS8F729ZI41"),
    // Security Configuration
    BCRYPT_ROUNDS: zod_1.z.string().default("12"),
    BLOCKCHAIN_RPC_URL: zod_1.z
        .string()
        .url()
        .optional()
        .default("https://arb1.arbitrum.io/rpc"),
    // Captcha Configuration
    CAPTCHA_SECRET_KEY: zod_1.z.string().optional(),
    CAPTCHA_SITE_KEY: zod_1.z.string().optional(),
    CORS_CREDENTIALS: zod_1.z.string().default("true"),
    // CORS Configuration
    CORS_ORIGIN: zod_1.z.string().default("http://localhost:3000"),
    // Database Configuration
    DATABASE_URL: zod_1.z.string().url(),
    DEBUG: zod_1.z.string().default("false"),
    // Game Hub Configuration
    GAME_HUB_ENABLED: zod_1.z.string().default("true"),
    GAME_HUB_MAINTENANCE: zod_1.z.string().default("false"),
    HOST: zod_1.z.string().default("0.0.0.0"),
    JWT_EXPIRES_IN: zod_1.z.string().default("7d"),
    // JWT Configuration
    JWT_SECRET: zod_1.z.string().min(32),
    LOG_FILE: zod_1.z.string().default("./logs/api.log"),
    // Logging Configuration
    LOG_LEVEL: zod_1.z.enum(["error", "warn", "info", "debug"]).default("info"),
    MAX_FILE_SIZE: zod_1.z.string().default("10485760"), // 10MB
    // Development Configuration
    NODE_ENV: zod_1.z
        .enum(["development", "production", "test"])
        .default("development"),
    // Notification Configuration
    NOTIFICATION_ENABLED: zod_1.z.string().default("true"),
    NOTIFICATION_RETENTION_DAYS: zod_1.z.string().default("30"),
    // Server Configuration
    PORT: zod_1.z.string().default("8080"),
    // Premium Configuration
    PREMIUM_ENABLED: zod_1.z.string().default("true"),
    PREMIUM_PRICE_USDT: zod_1.z.string().default("10"),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().default("100"),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default("60000"),
    // Redis Configuration
    REDIS_URL: zod_1.z.string().url().optional().default("redis://localhost:6379"),
    SESSION_SECRET: zod_1.z.string().min(32),
    // Tournament Configuration
    TOURNAMENT_ENABLED: zod_1.z.string().default("true"),
    TOURNAMENT_MIN_PRIZE: zod_1.z.string().default("100"),
    // File Upload Configuration
    UPLOAD_DIR: zod_1.z.string().default("./uploads"),
    USDT_CONTRACT_ADDRESS: zod_1.z
        .string()
        .optional()
        .default("0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9")
});
// Parse and validate environment variables
const parseEnv = () => {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        console.error("❌ Invalid environment configuration:");
        if (error instanceof zod_1.z.ZodError) {
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join(".")}: ${err.message}`);
            });
        }
        process.exit(1);
    }
};
exports.env = parseEnv();
// Helper functions for type conversion
const getNumber = (value, defaultValue = 0) => {
    const parsed = Number.parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};
exports.getNumber = getNumber;
const getBoolean = (value, defaultValue = false) => {
    return value.toLowerCase() === "true";
};
exports.getBoolean = getBoolean;
// Configuration object with parsed values
exports.config = {
    admin: {
        password: exports.env.ADMIN_PASSWORD,
        username: exports.env.ADMIN_USERNAME
    },
    analytics: {
        enabled: (0, exports.getBoolean)(exports.env.ANALYTICS_ENABLED),
        retentionDays: (0, exports.getNumber)(exports.env.ANALYTICS_RETENTION_DAYS)
    },
    blockchain: {
        arbiscanApiKey: exports.env.ARBISCAN_API_KEY,
        rpcUrl: exports.env.BLOCKCHAIN_RPC_URL,
        usdtContractAddress: exports.env.USDT_CONTRACT_ADDRESS
    },
    captcha: {
        secretKey: exports.env.CAPTCHA_SECRET_KEY,
        siteKey: exports.env.CAPTCHA_SITE_KEY
    },
    cors: {
        credentials: (0, exports.getBoolean)(exports.env.CORS_CREDENTIALS),
        origin: exports.env.CORS_ORIGIN
    },
    database: {
        url: exports.env.DATABASE_URL
    },
    development: {
        debug: (0, exports.getBoolean)(exports.env.DEBUG),
        nodeEnv: exports.env.NODE_ENV
    },
    gameHub: {
        enabled: (0, exports.getBoolean)(exports.env.GAME_HUB_ENABLED),
        maintenance: (0, exports.getBoolean)(exports.env.GAME_HUB_MAINTENANCE)
    },
    jwt: {
        expiresIn: exports.env.JWT_EXPIRES_IN,
        secret: exports.env.JWT_SECRET
    },
    logging: {
        file: exports.env.LOG_FILE,
        level: exports.env.LOG_LEVEL
    },
    notification: {
        enabled: (0, exports.getBoolean)(exports.env.NOTIFICATION_ENABLED),
        retentionDays: (0, exports.getNumber)(exports.env.NOTIFICATION_RETENTION_DAYS)
    },
    premium: {
        enabled: (0, exports.getBoolean)(exports.env.PREMIUM_ENABLED),
        priceUsdt: (0, exports.getNumber)(exports.env.PREMIUM_PRICE_USDT)
    },
    rateLimit: {
        maxRequests: (0, exports.getNumber)(exports.env.RATE_LIMIT_MAX_REQUESTS),
        windowMs: (0, exports.getNumber)(exports.env.RATE_LIMIT_WINDOW_MS)
    },
    redis: {
        url: exports.env.REDIS_URL
    },
    security: {
        bcryptRounds: (0, exports.getNumber)(exports.env.BCRYPT_ROUNDS),
        sessionSecret: exports.env.SESSION_SECRET
    },
    server: {
        host: exports.env.HOST,
        port: (0, exports.getNumber)(exports.env.PORT)
    },
    tournament: {
        enabled: (0, exports.getBoolean)(exports.env.TOURNAMENT_ENABLED),
        minPrize: (0, exports.getNumber)(exports.env.TOURNAMENT_MIN_PRIZE)
    },
    upload: {
        dir: exports.env.UPLOAD_DIR,
        maxFileSize: (0, exports.getNumber)(exports.env.MAX_FILE_SIZE)
    }
};
exports.default = exports.config;
