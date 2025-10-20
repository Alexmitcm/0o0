"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateBody = exports.updatePreferencesSchema = exports.createNotificationSchema = exports.fileUploadSchema = exports.gameQuerySchema = exports.paginationSchema = exports.adminActionSchema = exports.createAdminUserSchema = exports.joinTournamentSchema = exports.createTournamentSchema = exports.gameCommentSchema = exports.gameRatingSchema = exports.updateGameSchema = exports.createGameSchema = exports.syncLensSchema = exports.loginSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
// Common validation patterns
const walletAddressSchema = zod_1.z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format");
const profileIdSchema = zod_1.z.string().min(1, "Profile ID is required");
const cuidSchema = zod_1.z.string().cuid("Invalid ID format");
// User validation schemas
exports.createUserSchema = zod_1.z.object({
    avatarUrl: zod_1.z.string().url("Invalid avatar URL").optional(),
    bio: zod_1.z.string().max(500, "Bio too long").optional(),
    displayName: zod_1.z
        .string()
        .min(1, "Display name is required")
        .max(100, "Display name too long")
        .optional(),
    email: zod_1.z.string().email("Invalid email format").optional(),
    location: zod_1.z.string().max(100, "Location too long").optional(),
    referrerAddress: walletAddressSchema.optional(),
    twitterHandle: zod_1.z
        .string()
        .regex(/^@?[A-Za-z0-9_]{1,15}$/, "Invalid Twitter handle")
        .optional(),
    username: zod_1.z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(50, "Username too long")
        .optional(),
    walletAddress: walletAddressSchema,
    website: zod_1.z.string().url("Invalid website URL").optional()
});
exports.updateUserSchema = exports.createUserSchema
    .partial()
    .omit({ walletAddress: true });
exports.loginSchema = zod_1.z.object({
    selectedProfileId: profileIdSchema,
    walletAddress: walletAddressSchema
});
exports.syncLensSchema = zod_1.z.object({
    lensAccessToken: zod_1.z.string().min(1, "Lens access token is required"),
    selectedProfileId: profileIdSchema.optional()
});
// Game validation schemas
exports.createGameSchema = zod_1.z.object({
    categoryIds: zod_1.z.array(cuidSchema).optional(),
    coverImageUrl: zod_1.z.string().url("Invalid cover image URL"),
    description: zod_1.z
        .string()
        .min(1, "Description is required")
        .max(2000, "Description too long"),
    developerName: zod_1.z.string().max(100, "Developer name too long").optional(),
    entryFilePath: zod_1.z.string().default("index.html"),
    height: zod_1.z.number().int().min(240).max(4096).default(720),
    iconUrl: zod_1.z.string().url("Invalid icon URL"),
    instructions: zod_1.z.string().max(5000, "Instructions too long").optional(),
    orientation: zod_1.z.enum(["Landscape", "Portrait", "Both"]).default("Landscape"),
    packageUrl: zod_1.z.string().url("Invalid package URL"),
    tagNames: zod_1.z.array(zod_1.z.string().min(1).max(50)).optional(),
    title: zod_1.z.string().min(1, "Title is required").max(200, "Title too long"),
    version: zod_1.z.string().max(20, "Version too long").optional(),
    width: zod_1.z.number().int().min(320).max(4096).default(1280)
});
exports.updateGameSchema = exports.createGameSchema
    .partial()
    .omit({ packageUrl: true });
exports.gameRatingSchema = zod_1.z.object({
    gameId: cuidSchema,
    rating: zod_1.z.number().int().min(1).max(5)
});
exports.gameCommentSchema = zod_1.z.object({
    content: zod_1.z
        .string()
        .min(1, "Comment content is required")
        .max(2000, "Comment too long"),
    gameId: cuidSchema,
    parentId: cuidSchema.optional()
});
// Tournament validation schemas
exports.createTournamentSchema = zod_1.z.object({
    chainId: zod_1.z.number().int().min(1).optional(),
    endDate: zod_1.z.string().datetime("Invalid end date format"),
    equilibriumMax: zod_1.z.number().int().min(0).optional(),
    equilibriumMin: zod_1.z.number().int().min(0).optional(),
    minCoins: zod_1.z
        .string()
        .regex(/^\d+(\.\d+)?$/)
        .optional(),
    name: zod_1.z
        .string()
        .min(1, "Tournament name is required")
        .max(200, "Name too long"),
    prizePool: zod_1.z.string().regex(/^\d+(\.\d+)?$/, "Invalid prize pool amount"),
    prizeTokenAddress: walletAddressSchema.optional(),
    startDate: zod_1.z.string().datetime("Invalid start date format"),
    type: zod_1.z.enum(["Balanced", "Unbalanced"])
});
exports.joinTournamentSchema = zod_1.z.object({
    tournamentId: cuidSchema,
    walletAddress: walletAddressSchema
});
// Admin validation schemas
exports.createAdminUserSchema = zod_1.z.object({
    displayName: zod_1.z
        .string()
        .min(1, "Display name is required")
        .max(100, "Display name too long")
        .optional(),
    email: zod_1.z.string().email("Invalid email format"),
    role: zod_1.z
        .enum(["SuperAdmin", "SupportAgent", "Auditor", "Moderator"])
        .default("SupportAgent"),
    username: zod_1.z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(50, "Username too long"),
    walletAddress: walletAddressSchema
});
exports.adminActionSchema = zod_1.z.object({
    actionType: zod_1.z.enum([
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
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    reason: zod_1.z.string().min(1, "Reason is required").max(500, "Reason too long"),
    targetProfileId: profileIdSchema.optional(),
    targetWallet: walletAddressSchema
});
// Query parameter schemas
exports.paginationSchema = zod_1.z.object({
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).default("20"),
    page: zod_1.z.string().regex(/^\d+$/).transform(Number).default("1"),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc")
});
exports.gameQuerySchema = exports.paginationSchema.extend({
    category: zod_1.z.string().optional(),
    maxRating: zod_1.z
        .string()
        .regex(/^\d+(\.\d+)?$/)
        .transform(Number)
        .optional(),
    minRating: zod_1.z
        .string()
        .regex(/^\d+(\.\d+)?$/)
        .transform(Number)
        .optional(),
    search: zod_1.z.string().optional(),
    status: zod_1.z.enum(["Draft", "Published"]).optional(),
    tag: zod_1.z.string().optional()
});
// File upload schemas
exports.fileUploadSchema = zod_1.z.object({
    file: zod_1.z.instanceof(File, { message: "File is required" }),
    gameId: cuidSchema.optional(),
    type: zod_1.z.enum(["game", "thumbnail", "screenshot"])
});
// Notification schemas
exports.createNotificationSchema = zod_1.z.object({
    actionMetadata: zod_1.z.record(zod_1.z.any()).optional(),
    actionUrl: zod_1.z.string().url("Invalid action URL").optional(),
    message: zod_1.z
        .string()
        .min(1, "Message is required")
        .max(1000, "Message too long"),
    priority: zod_1.z.enum(["Low", "Normal", "High", "Urgent"]).default("Normal"),
    title: zod_1.z.string().min(1, "Title is required").max(200, "Title too long"),
    type: zod_1.z.enum([
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
exports.updatePreferencesSchema = zod_1.z.object({
    autoLinkProfile: zod_1.z.boolean().optional(),
    emailNotifications: zod_1.z.boolean().optional(),
    language: zod_1.z.string().min(2).max(10).optional(),
    marketingEmails: zod_1.z.boolean().optional(),
    privacyLevel: zod_1.z.enum(["Public", "Private", "FriendsOnly"]).optional(),
    pushNotifications: zod_1.z.boolean().optional(),
    showPremiumBadge: zod_1.z.boolean().optional(),
    timezone: zod_1.z.string().min(1).max(50).optional()
});
// Utility function to validate request body
const validateBody = (schema) => {
    return async (c, next) => {
        try {
            const body = await c.req.json();
            const validatedData = schema.parse(body);
            c.set("validatedBody", validatedData);
            await next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return c.json({
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
                }, 400);
            }
            throw error;
        }
    };
};
exports.validateBody = validateBody;
// Utility function to validate query parameters
const validateQuery = (schema) => {
    return async (c, next) => {
        try {
            const query = Object.fromEntries(c.req.query());
            const validatedData = schema.parse(query);
            c.set("validatedQuery", validatedData);
            await next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return c.json({
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
                }, 400);
            }
            throw error;
        }
    };
};
exports.validateQuery = validateQuery;
