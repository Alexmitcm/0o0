import { z } from "zod";

// Game validation schema
export const gameValidationSchema = z.object({
  coverImageUrl: z
    .string()
    .url("Invalid cover image URL")
    .max(500, "Cover image URL too long"),
  description: z.string().min(1, "Description is required"),
  developerName: z.string().max(100, "Developer name too long").optional(),
  dislikeCount: z
    .number()
    .int()
    .min(0, "Dislike count must be non-negative")
    .default(0),
  entryFilePath: z
    .string()
    .max(100, "Entry file path too long")
    .default("index.html"),
  gameType: z.enum(["FreeToPlay", "PlayToEarn"]).default("FreeToPlay"),
  height: z
    .number()
    .int()
    .min(240, "Height must be at least 240px")
    .max(1080, "Height must be at most 1080px"),
  iconUrl: z.string().url("Invalid icon URL").max(500, "Icon URL too long"),
  instructions: z.string().optional(),
  likeCount: z
    .number()
    .int()
    .min(0, "Like count must be non-negative")
    .default(0),
  orientation: z.enum(["Landscape", "Portrait"]).default("Landscape"),
  packageUrl: z
    .string()
    .url("Invalid package URL")
    .max(500, "Package URL too long"),
  playCount: z
    .number()
    .int()
    .min(0, "Play count must be non-negative")
    .default(0),
  rating: z
    .number()
    .min(0, "Rating must be non-negative")
    .max(5, "Rating must be at most 5")
    .default(0),
  ratingCount: z
    .number()
    .int()
    .min(0, "Rating count must be non-negative")
    .default(0),
  slug: z.string().min(1, "Slug is required").max(100, "Slug too long"),
  status: z.enum(["Draft", "Published", "Archived"]).default("Draft"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  version: z.string().max(20, "Version too long").optional(),
  width: z
    .number()
    .int()
    .min(320, "Width must be at least 320px")
    .max(1920, "Width must be at most 1920px")
});

// Game update validation schema (all fields optional except id)
export const gameUpdateValidationSchema = gameValidationSchema
  .partial()
  .extend({
    id: z.string().min(1, "Game ID is required")
  });

// Game query validation schema
export const gameQueryValidationSchema = z.object({
  category: z.string().optional(),
  gameType: z.enum(["FreeToPlay", "PlayToEarn"]).optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = Number.parseInt(val || "20", 10);
      return Math.min(100, Math.max(1, num));
    }),
  page: z
    .string()
    .optional()
    .transform((val) => {
      const num = Number.parseInt(val || "1", 10);
      return Math.max(1, num);
    }),
  search: z.string().optional(),
  source: z.string().optional(),
  tag: z.string().optional()
});

export type GameValidationInput = z.infer<typeof gameValidationSchema>;
export type GameUpdateValidationInput = z.infer<
  typeof gameUpdateValidationSchema
>;
export type GameQueryValidationInput = z.infer<
  typeof gameQueryValidationSchema
>;
