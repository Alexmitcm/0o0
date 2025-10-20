"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameQueryValidationSchema = exports.gameUpdateValidationSchema = exports.gameValidationSchema = void 0;
const zod_1 = require("zod");
// Game validation schema
exports.gameValidationSchema = zod_1.z.object({
    coverImageUrl: zod_1.z
        .string()
        .url("Invalid cover image URL")
        .max(500, "Cover image URL too long"),
    description: zod_1.z.string().min(1, "Description is required"),
    developerName: zod_1.z.string().max(100, "Developer name too long").optional(),
    dislikeCount: zod_1.z
        .number()
        .int()
        .min(0, "Dislike count must be non-negative")
        .default(0),
    entryFilePath: zod_1.z
        .string()
        .max(100, "Entry file path too long")
        .default("index.html"),
    gameType: zod_1.z.enum(["FreeToPlay", "PlayToEarn"]).default("FreeToPlay"),
    height: zod_1.z
        .number()
        .int()
        .min(240, "Height must be at least 240px")
        .max(1080, "Height must be at most 1080px"),
    iconUrl: zod_1.z.string().url("Invalid icon URL").max(500, "Icon URL too long"),
    instructions: zod_1.z.string().optional(),
    likeCount: zod_1.z
        .number()
        .int()
        .min(0, "Like count must be non-negative")
        .default(0),
    orientation: zod_1.z.enum(["Landscape", "Portrait"]).default("Landscape"),
    packageUrl: zod_1.z
        .string()
        .url("Invalid package URL")
        .max(500, "Package URL too long"),
    playCount: zod_1.z
        .number()
        .int()
        .min(0, "Play count must be non-negative")
        .default(0),
    rating: zod_1.z
        .number()
        .min(0, "Rating must be non-negative")
        .max(5, "Rating must be at most 5")
        .default(0),
    ratingCount: zod_1.z
        .number()
        .int()
        .min(0, "Rating count must be non-negative")
        .default(0),
    slug: zod_1.z.string().min(1, "Slug is required").max(100, "Slug too long"),
    status: zod_1.z.enum(["Draft", "Published", "Archived"]).default("Draft"),
    title: zod_1.z.string().min(1, "Title is required").max(200, "Title too long"),
    version: zod_1.z.string().max(20, "Version too long").optional(),
    width: zod_1.z
        .number()
        .int()
        .min(320, "Width must be at least 320px")
        .max(1920, "Width must be at most 1920px")
});
// Game update validation schema (all fields optional except id)
exports.gameUpdateValidationSchema = exports.gameValidationSchema
    .partial()
    .extend({
    id: zod_1.z.string().min(1, "Game ID is required")
});
// Game query validation schema
exports.gameQueryValidationSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    gameType: zod_1.z.enum(["FreeToPlay", "PlayToEarn"]).optional(),
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => {
        const num = Number.parseInt(val || "20", 10);
        return Math.min(100, Math.max(1, num));
    }),
    page: zod_1.z
        .string()
        .optional()
        .transform((val) => {
        const num = Number.parseInt(val || "1", 10);
        return Math.max(1, num);
    }),
    search: zod_1.z.string().optional(),
    source: zod_1.z.string().optional(),
    tag: zod_1.z.string().optional()
});
