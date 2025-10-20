"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadGame = void 0;
const zod_1 = require("zod");
const client_1 = __importDefault(require("../../prisma/client"));
const FileService_1 = require("../../services/FileService");
const uploadGameSchema = zod_1.z.object({
    categories: zod_1.z.array(zod_1.z.string()).min(1),
    description: zod_1.z.string().optional(),
    height: zod_1.z.number().min(240).max(1080).default(720),
    instructions: zod_1.z.string().optional(),
    slug: zod_1.z
        .string()
        .min(3)
        .max(15)
        .regex(/^[a-z0-9-]+$/),
    title: zod_1.z.string().min(1).max(100),
    width: zod_1.z.number().min(320).max(1920).default(1280)
});
const uploadGame = async (c) => {
    try {
        const walletAddress = c.get("walletAddress");
        if (!walletAddress) {
            return c.json({ error: "Unauthorized - Please sign in" }, 401);
        }
        // Parse form data
        const formData = await c.req.formData();
        // Extract form fields with proper null handling
        const title = formData.get("title");
        const slug = formData.get("slug");
        const description = formData.get("description")
            ? formData.get("description")
            : "";
        const instructions = formData.get("instructions")
            ? formData.get("instructions")
            : "";
        const width = Number.parseInt(formData.get("width")) || 1280;
        const height = Number.parseInt(formData.get("height")) || 720;
        const categoriesStr = formData.get("categories");
        const categories = categoriesStr ? JSON.parse(categoriesStr) : [];
        const validatedData = uploadGameSchema.parse({
            categories,
            description,
            height,
            instructions,
            slug,
            title,
            width
        });
        // Check if game with slug already exists
        const existingGame = await client_1.default.game.findUnique({
            where: { slug: validatedData.slug }
        });
        if (existingGame) {
            return c.json({ error: "Game with this slug already exists" }, 400);
        }
        // Handle file upload
        const gameFile = formData.get("gameFile");
        const cardCoverFile = formData.get("cardCover") || formData.get("thumb1");
        const thumb2File = formData.get("thumb2") || null;
        if (!gameFile || !cardCoverFile) {
            return c.json({ error: "Game file and a card cover image are required" }, 400);
        }
        // Save files locally
        const { basePath, entryFilePath } = await FileService_1.FileService.saveGameFile(gameFile, validatedData.slug);
        const coverUrl = await FileService_1.FileService.saveThumbnail(cardCoverFile, validatedData.slug, "cover");
        const iconUrl = thumb2File
            ? await FileService_1.FileService.saveThumbnail(thumb2File, validatedData.slug, "icon")
            : coverUrl;
        // Get or create categories
        const categoryIds = await Promise.all(validatedData.categories.map(async (rawName) => {
            const name = rawName.trim();
            let category = await client_1.default.gameCategory.findUnique({
                where: { name }
            });
            if (!category) {
                category = await client_1.default.gameCategory.create({
                    data: { name }
                });
            }
            return category.id;
        }));
        // Create the game
        const game = await client_1.default.game.create({
            data: {
                categories: {
                    connect: categoryIds.map((id) => ({ id }))
                },
                coverImageUrl: coverUrl,
                description: validatedData.description || "",
                entryFilePath,
                height: validatedData.height,
                iconUrl: iconUrl,
                instructions: validatedData.instructions,
                packageUrl: basePath,
                slug: validatedData.slug,
                status: "Published", // Set status to Published so it appears in Game Hub
                title: validatedData.title,
                width: validatedData.width
            },
            include: {
                categories: true
            }
        });
        return c.json({ game, success: true }, 201);
    }
    catch (error) {
        console.error("Upload game error:", error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json({ details: error.errors, error: "Validation error" }, 400);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
};
exports.uploadGame = uploadGame;
