"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = void 0;
const zod_1 = require("zod");
const client_1 = __importDefault(require("../../prisma/client"));
const createCategorySchema = zod_1.z.object({
    description: zod_1.z.string().optional(),
    icon: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1).max(50)
});
const createCategory = async (c) => {
    try {
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }
        const body = await c.req.json();
        const validatedData = createCategorySchema.parse(body);
        // Check if category already exists
        const existingCategory = await client_1.default.gameCategory.findUnique({
            where: { name: validatedData.name }
        });
        if (existingCategory) {
            return c.json({ error: "Category already exists" }, 400);
        }
        // Create the category
        const category = await client_1.default.gameCategory.create({
            data: {
                description: validatedData.description,
                icon: validatedData.icon,
                name: validatedData.name,
                slug: validatedData.name.toLowerCase().replace(/\s+/g, "-")
            }
        });
        return c.json({ category, success: true }, 201);
    }
    catch (error) {
        console.error("Create category error:", error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json({ details: error.errors, error: "Validation error" }, 400);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
};
exports.createCategory = createCategory;
