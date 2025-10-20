import type { Context, Next } from "hono";
import { z } from "zod";

// Common validation patterns
const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format");
const profileIdSchema = z.string().min(1, "Profile ID is required");
const cuidSchema = z.string().cuid("Invalid ID format");

// User validation schemas
export const createUserSchema = z.object({
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name too long")
    .optional(),
  email: z.string().email("Invalid email format").optional(),
  location: z.string().max(100, "Location too long").optional(),
  referrerAddress: walletAddressSchema.optional(),
  twitterHandle: z
    .string()
    .regex(/^@?[A-Za-z0-9_]{1,15}$/, "Invalid Twitter handle")
    .optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username too long")
    .optional(),
  walletAddress: walletAddressSchema,
  website: z.string().url("Invalid website URL").optional()
});

export const updateUserSchema = createUserSchema
  .partial()
  .omit({ walletAddress: true });

export const loginSchema = z.object({
  selectedProfileId: profileIdSchema,
  walletAddress: walletAddressSchema
});

export const syncLensSchema = z.object({
  lensAccessToken: z.string().min(1, "Lens access token is required"),
  selectedProfileId: profileIdSchema.optional()
});

// Game validation schemas
export const createGameSchema = z.object({
  categoryIds: z.array(cuidSchema).optional(),
  coverImageUrl: z.string().url("Invalid cover image URL"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description too long"),
  developerName: z.string().max(100, "Developer name too long").optional(),
  entryFilePath: z.string().default("index.html"),
  height: z.number().int().min(240).max(4096).default(720),
  iconUrl: z.string().url("Invalid icon URL"),
  instructions: z.string().max(5000, "Instructions too long").optional(),
  orientation: z.enum(["Landscape", "Portrait", "Both"]).default("Landscape"),
  packageUrl: z.string().url("Invalid package URL"),
  tagNames: z.array(z.string().min(1).max(50)).optional(),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  version: z.string().max(20, "Version too long").optional(),
  width: z.number().int().min(320).max(4096).default(1280)
});

export const updateGameSchema = createGameSchema
  .partial()
  .omit({ packageUrl: true });

export const gameRatingSchema = z.object({
  gameId: cuidSchema,
  rating: z.number().int().min(1).max(5)
});

export const gameCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(2000, "Comment too long"),
  gameId: cuidSchema,
  parentId: cuidSchema.optional()
});

// Tournament validation schemas
export const createTournamentSchema = z.object({
  chainId: z.number().int().min(1).optional(),
  endDate: z.string().datetime("Invalid end date format"),
  equilibriumMax: z.number().int().min(0).optional(),
  equilibriumMin: z.number().int().min(0).optional(),
  minCoins: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .optional(),
  name: z
    .string()
    .min(1, "Tournament name is required")
    .max(200, "Name too long"),
  prizePool: z.string().regex(/^\d+(\.\d+)?$/, "Invalid prize pool amount"),
  prizeTokenAddress: walletAddressSchema.optional(),
  startDate: z.string().datetime("Invalid start date format"),
  type: z.enum(["Balanced", "Unbalanced"])
});

export const joinTournamentSchema = z.object({
  tournamentId: cuidSchema,
  walletAddress: walletAddressSchema
});

// Admin validation schemas
export const createAdminUserSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name too long")
    .optional(),
  email: z.string().email("Invalid email format"),
  role: z
    .enum(["SuperAdmin", "SupportAgent", "Auditor", "Moderator"])
    .default("SupportAgent"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username too long"),
  walletAddress: walletAddressSchema
});

export const adminActionSchema = z.object({
  actionType: z.enum([
    "ForceUnlinkProfile",
    "ForceLinkProfile",
    "GrantPremium",
    "RevokePremium",
    "UpdateFeatureAccess",
    "AddAdminNote",
    "UpdateUserStatus",
    "BlockUser",
    "UnblockUser"
  ]),
  metadata: z.record(z.any()).optional(),
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
  targetProfileId: profileIdSchema.optional(),
  targetWallet: walletAddressSchema
});

// Query parameter schemas
export const paginationSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).default("20"),
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});

export const gameQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  maxRating: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .transform(Number)
    .optional(),
  minRating: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .transform(Number)
    .optional(),
  search: z.string().optional(),
  status: z.enum(["Draft", "Published"]).optional(),
  tag: z.string().optional()
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: "File is required" }),
  gameId: cuidSchema.optional(),
  type: z.enum(["game", "thumbnail", "screenshot"])
});

// Notification schemas
export const createNotificationSchema = z.object({
  actionMetadata: z.record(z.any()).optional(),
  actionUrl: z.string().url("Invalid action URL").optional(),
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message too long"),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).default("Normal"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  type: z.enum([
    "Welcome",
    "Premium",
    "Quest",
    "Reward",
    "Referral",
    "System",
    "Marketing"
  ])
});

// Preference schemas
export const updatePreferencesSchema = z.object({
  autoLinkProfile: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  language: z.string().min(2).max(10).optional(),
  marketingEmails: z.boolean().optional(),
  privacyLevel: z.enum(["Public", "Private", "FriendsOnly"]).optional(),
  pushNotifications: z.boolean().optional(),
  showPremiumBadge: z.boolean().optional(),
  timezone: z.string().min(1).max(50).optional()
});

// Utility function to validate request body
export const validateBody = <T>(schema: z.ZodSchema<T>) => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validatedData = schema.parse(body);
      c.set("validatedBody", validatedData);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              details: error.errors.map((err) => ({
                code: err.code,
                field: err.path.join("."),
                message: err.message
              })),
              message: "Request validation failed",
              timestamp: new Date().toISOString()
            },
            status: "Error",
            success: false
          },
          400
        );
      }
      throw error;
    }
  };
};

// Utility function to validate query parameters
export const validateQuery = <T>(schema: z.ZodSchema<T>) => {
  return async (c: Context, next: Next) => {
    try {
      const query = Object.fromEntries(c.req.query());
      const validatedData = schema.parse(query);
      c.set("validatedQuery", validatedData);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              details: error.errors.map((err) => ({
                code: err.code,
                field: err.path.join("."),
                message: err.message
              })),
              message: "Query parameter validation failed",
              timestamp: new Date().toISOString()
            },
            status: "Error",
            success: false
          },
          400
        );
      }
      throw error;
    }
  };
};
