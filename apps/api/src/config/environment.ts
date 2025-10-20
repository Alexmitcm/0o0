import { z } from "zod";

// Environment validation schema
const envSchema = z.object({
  ADMIN_PASSWORD: z.string().min(8),

  // Admin Configuration
  ADMIN_USERNAME: z.string().default("admin"),

  // Analytics Configuration
  ANALYTICS_ENABLED: z.string().default("true"),
  ANALYTICS_RETENTION_DAYS: z.string().default("90"),

  // Blockchain Configuration
  ARBISCAN_API_KEY: z
    .string()
    .optional()
    .default("68VNDTYKGYFHYACCY35W4XSWS8F729ZI41"),

  // Security Configuration
  BCRYPT_ROUNDS: z.string().default("12"),
  BLOCKCHAIN_RPC_URL: z
    .string()
    .url()
    .optional()
    .default("https://arb1.arbitrum.io/rpc"),

  // Captcha Configuration
  CAPTCHA_SECRET_KEY: z.string().optional(),
  CAPTCHA_SITE_KEY: z.string().optional(),
  CORS_CREDENTIALS: z.string().default("true"),

  // CORS Configuration
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  // Database Configuration
  DATABASE_URL: z.string().url(),
  DEBUG: z.string().default("false"),

  // Game Hub Configuration
  GAME_HUB_ENABLED: z.string().default("true"),
  GAME_HUB_MAINTENANCE: z.string().default("false"),
  HOST: z.string().default("0.0.0.0"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  LOG_FILE: z.string().default("./logs/api.log"),

  // Logging Configuration
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  MAX_FILE_SIZE: z.string().default("10485760"), // 10MB

  // Development Configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Notification Configuration
  NOTIFICATION_ENABLED: z.string().default("true"),
  NOTIFICATION_RETENTION_DAYS: z.string().default("30"),

  // Server Configuration
  PORT: z.string().default("8080"),

  // Premium Configuration
  PREMIUM_ENABLED: z.string().default("true"),
  PREMIUM_PRICE_USDT: z.string().default("10"),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default("60000"),

  // Redis Configuration (no default to avoid unwanted local connections)
  REDIS_URL: z.string().url().optional(),
  // Force disable Redis (overrides REDIS_URL)
  DISABLE_REDIS: z.string().optional().default("false"),
  SESSION_SECRET: z.string().min(32),

  // Tournament Configuration
  TOURNAMENT_ENABLED: z.string().default("true"),
  TOURNAMENT_MIN_PRIZE: z.string().default("100"),

  // File Upload Configuration
  UPLOAD_DIR: z.string().default("./uploads"),
  USDT_CONTRACT_ADDRESS: z
    .string()
    .optional()
    .default("0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9")
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Invalid environment configuration:");
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    }
    process.exit(1);
  }
};

export const env = parseEnv();

// Helper functions for type conversion
export const getNumber = (value: string, defaultValue = 0): number => {
  const parsed = Number.parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const getBoolean = (value: string, defaultValue = false): boolean => {
  return value.toLowerCase() === "true";
};

// Configuration object with parsed values
export const config = {
  admin: {
    password: env.ADMIN_PASSWORD,
    username: env.ADMIN_USERNAME
  },
  analytics: {
    enabled: getBoolean(env.ANALYTICS_ENABLED),
    retentionDays: getNumber(env.ANALYTICS_RETENTION_DAYS)
  },
  blockchain: {
    arbiscanApiKey: env.ARBISCAN_API_KEY,
    rpcUrl: env.BLOCKCHAIN_RPC_URL,
    usdtContractAddress: env.USDT_CONTRACT_ADDRESS
  },
  captcha: {
    secretKey: env.CAPTCHA_SECRET_KEY,
    siteKey: env.CAPTCHA_SITE_KEY
  },
  cors: {
    credentials: getBoolean(env.CORS_CREDENTIALS),
    origin: env.CORS_ORIGIN
  },
  database: {
    url: env.DATABASE_URL
  },
  development: {
    debug: getBoolean(env.DEBUG),
    nodeEnv: env.NODE_ENV
  },
  gameHub: {
    enabled: getBoolean(env.GAME_HUB_ENABLED),
    maintenance: getBoolean(env.GAME_HUB_MAINTENANCE)
  },
  jwt: {
    expiresIn: env.JWT_EXPIRES_IN,
    secret: env.JWT_SECRET
  },
  logging: {
    file: env.LOG_FILE,
    level: env.LOG_LEVEL
  },
  notification: {
    enabled: getBoolean(env.NOTIFICATION_ENABLED),
    retentionDays: getNumber(env.NOTIFICATION_RETENTION_DAYS)
  },
  premium: {
    enabled: getBoolean(env.PREMIUM_ENABLED),
    priceUsdt: getNumber(env.PREMIUM_PRICE_USDT)
  },
  rateLimit: {
    maxRequests: getNumber(env.RATE_LIMIT_MAX_REQUESTS),
    windowMs: getNumber(env.RATE_LIMIT_WINDOW_MS)
  },
  redis: {
    url: env.REDIS_URL
  },
  security: {
    bcryptRounds: getNumber(env.BCRYPT_ROUNDS),
    sessionSecret: env.SESSION_SECRET
  },
  server: {
    host: env.HOST,
    port: getNumber(env.PORT)
  },
  tournament: {
    enabled: getBoolean(env.TOURNAMENT_ENABLED),
    minPrize: getNumber(env.TOURNAMENT_MIN_PRIZE)
  },
  upload: {
    dir: env.UPLOAD_DIR,
    maxFileSize: getNumber(env.MAX_FILE_SIZE)
  }
};

export default config;
