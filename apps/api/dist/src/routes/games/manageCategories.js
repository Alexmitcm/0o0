"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryStats = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getManagedCategories = void 0;
const zod_1 = require("zod");
const client_1 = __importDefault(require("../../prisma/client"));
const logger_1 = __importDefault(require("../../utils/logger"));
// Validation schemas
const createCategorySchema = zod_1.z.object({
    color: zod_1.z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional(),
    description: zod_1.z.string().optional(),
    icon: zod_1.z.string().optional(),
    metaDescription: zod_1.z.string().optional(),
    name: zod_1.z
        .string()
        .min(2)
        .max(50)
        .regex(/^[a-zA-Z0-9\s-]+$/),
    slug: zod_1.z
        .string()
        .min(2)
        .max(50)
        .regex(/^[a-z0-9-]+$/)
        .optional()
});
const updateCategorySchema = createCategorySchema.partial().extend({
    id: zod_1.z.string()
});
// Get all categories with game counts
const getManagedCategories = async (c) => {
    try {
        const categories = await client_1.default.gameCategory.findMany({
            include: {
                _count: {
                    select: {
                        games: true
                    }
                }
            },
            orderBy: {
                name: "asc"
            }
        });
        return c.json({ categories });
    }
    catch (error) {
        logger_1.default.error("Error fetching categories:", error);
        return c.json({ error: "Failed to fetch categories" }, 500);
    }
};
exports.getManagedCategories = getManagedCategories;
// Create a new category
const createCategory = async (c) => {
    try {
        const body = await c.req.json();
        const validatedData = createCategorySchema.parse(body);
        // Check if category with name already exists
        const existingCategory = await client_1.default.gameCategory.findFirst({
            where: {
                OR: [
                    { name: validatedData.name },
                    validatedData.slug ? { slug: validatedData.slug } : undefined
                ].filter(Boolean)
            }
        });
        if (existingCategory) {
            return c.json({ error: "Category with this name already exists" }, 400);
        }
        // Create category
        const category = await client_1.default.gameCategory.create({
            data: {
                description: validatedData.description,
                metaDescription: validatedData.metaDescription,
                name: validatedData.name,
                slug: validatedData.slug ||
                    validatedData.name.toLowerCase().replace(/\s+/g, "-")
            }
        });
        logger_1.default.info(`Category created: ${category.id} - ${category.name}`);
        return c.json({ category, message: "Category created successfully" }, 201);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return c.json({ details: error.errors, error: "Validation error" }, 400);
        }
        logger_1.default.error("Error creating category:", error);
        return c.json({ error: "Failed to create category" }, 500);
    }
};
exports.createCategory = createCategory;
// Update an existing category
const updateCategory = async (c) => {
    try {
        const categoryId = c.req.param("id");
        const body = await c.req.json();
        const validatedData = updateCategorySchema.parse({
            ...body,
            id: categoryId
        });
        // Check if category exists
        const existingCategory = await client_1.default.gameCategory.findUnique({
            where: { id: categoryId }
        });
        if (!existingCategory) {
            return c.json({ error: "Category not found" }, 404);
        }
        // Check if name is being changed and if it conflicts
        if (validatedData.name && validatedData.name !== existingCategory.name) {
            const nameConflict = await client_1.default.gameCategory.findUnique({
                where: { name: validatedData.name }
            });
            if (nameConflict)
                return c.json({ error: "Category with this name already exists" }, 400);
        }
        if (validatedData.slug && validatedData.slug !== existingCategory.slug) {
            const slugConflict = await client_1.default.gameCategory.findUnique({
                where: { slug: validatedData.slug }
            });
            if (slugConflict)
                return c.json({ error: "Category with this slug already exists" }, 400);
        }
        // Update category
        const updatedCategory = await client_1.default.gameCategory.update({
            data: {
                description: validatedData.description,
                metaDescription: validatedData.metaDescription,
                name: validatedData.name,
                slug: validatedData.slug
            },
            where: { id: categoryId }
        });
        logger_1.default.info(`Category updated: ${updatedCategory.id} - ${updatedCategory.name}`);
        return c.json({
            category: updatedCategory,
            message: "Category updated successfully"
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return c.json({ details: error.errors, error: "Validation error" }, 400);
        }
        logger_1.default.error("Error updating category:", error);
        return c.json({ error: "Failed to update category" }, 500);
    }
};
exports.updateCategory = updateCategory;
// Delete a category
const deleteCategory = async (c) => {
    try {
        const categoryId = c.req.param("id");
        // Check if category exists
        const existingCategory = await client_1.default.gameCategory.findUnique({
            include: {
                _count: {
                    select: {
                        games: true
                    }
                }
            },
            where: { id: categoryId }
        });
        if (!existingCategory) {
            return c.json({ error: "Category not found" }, 404);
        }
        // Check if category has games
        if (existingCategory._count.games > 0) {
            return c.json({
                error: "Cannot delete category with games",
                gameCount: existingCategory._count.games
            }, 400);
        }
        // Delete category
        await client_1.default.gameCategory.delete({
            where: { id: categoryId }
        });
        logger_1.default.info(`Category deleted: ${categoryId} - ${existingCategory.name}`);
        return c.json({ message: "Category deleted successfully" });
    }
    catch (error) {
        logger_1.default.error("Error deleting category:", error);
        return c.json({ error: "Failed to delete category" }, 500);
    }
};
exports.deleteCategory = deleteCategory;
// Get category statistics
const getCategoryStats = async (c) => {
    try {
        const categories = await client_1.default.gameCategory.findMany({
            include: {
                _count: {
                    select: {
                        games: true
                    }
                }
            },
            orderBy: {
                _count: {
                    games: "desc"
                }
            }
        });
        const totalCategories = categories.length;
        const totalGames = categories.reduce((sum, cat) => sum + cat._count.games, 0);
        const averageGamesPerCategory = totalCategories > 0 ? totalGames / totalCategories : 0;
        return c.json({
            categories,
            stats: {
                averageGamesPerCategory: Math.round(averageGamesPerCategory * 100) / 100,
                totalCategories,
                totalGames
            }
        });
    }
    catch (error) {
        logger_1.default.error("Error fetching category stats:", error);
        return c.json({ error: "Failed to fetch category statistics" }, 500);
    }
};
exports.getCategoryStats = getCategoryStats;
