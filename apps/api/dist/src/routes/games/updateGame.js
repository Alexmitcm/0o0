"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGame = void 0;
const zod_1 = require("zod");
const client_1 = __importDefault(require("../../prisma/client"));
const updateGameSchema = zod_1.z.object({
    categories: zod_1.z.array(zod_1.z.string()).optional(),
    description: zod_1.z.string().optional(),
    height: zod_1.z.number().min(240).max(1080).optional(),
    instructions: zod_1.z.string().optional(),
    isFeatured: zod_1.z.boolean().optional(),
    status: zod_1.z.enum(["Active", "Inactive", "Pending", "Rejected"]).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    title: zod_1.z.string().min(1).max(100).optional(),
    width: zod_1.z.number().min(320).max(1920).optional()
});
const updateGame = async (c) => {
    try {
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        const gameId = c.req.param("id");
        const body = await c.req.json();
        const validatedData = updateGameSchema.parse(body);
        // Check if game exists
        const game = await client_1.default.game.findUnique({
            where: { id: gameId }
        });
        if (!game) {
            return c.json({ error: "Game not found" }, 404);
        }
        // Check if user is the uploader or admin
        if (game.uploadedBy !== user.walletAddress) {
            return c.json({ error: "Unauthorized to update this game" }, 403);
        }
        // Prepare update data
        const updateData = { ...validatedData };
        delete updateData.categories;
        // Handle categories if provided
        if (validatedData.categories) {
            const categoryIds = await Promise.all(validatedData.categories.map(async (categoryName) => {
                let category = await client_1.default.gameCategory.findUnique({
                    where: { name: categoryName }
                });
                if (!category) {
                    category = await client_1.default.gameCategory.create({
                        data: {
                            name: categoryName,
                            slug: categoryName.toLowerCase().replace(/\s+/g, "-")
                        }
                    });
                }
                return category.id;
            }));
            updateData.categories = {
                set: categoryIds.map((id) => ({ id }))
            };
        }
        // Update the game
        const updatedGame = await client_1.default.game.update({
            data: updateData,
            include: {
                categories: true,
                user: {
                    select: {
                        avatarUrl: true,
                        displayName: true,
                        username: true,
                        walletAddress: true
                    }
                }
            },
            where: { id: gameId }
        });
        return c.json({ game: updatedGame, success: true });
    }
    catch (error) {
        console.error("Update game error:", error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json({ details: error.errors, error: "Validation error" }, 400);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
};
exports.updateGame = updateGame;
