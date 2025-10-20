import type { Context } from "hono";
import { z } from "zod";
import prisma from "../../prisma/client";
import logger from "../../utils/logger";

// Validation schemas
const createCategorySchema = z.object({
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  metaDescription: z.string().optional(),
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z0-9\s-]+$/),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional()
});

const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string()
});

// Get all categories with game counts
export const getManagedCategories = async (c: Context) => {
  try {
    const categories = await prisma.gameCategory.findMany({
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
  } catch (error) {
    logger.error("Error fetching categories:", error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
};

// Create a new category
export const createCategory = async (c: Context) => {
  try {
    const body = await c.req.json();
    const validatedData = createCategorySchema.parse(body);

    // Check if category with name already exists
    const existingCategory = await prisma.gameCategory.findFirst({
      where: {
        OR: [
          { name: validatedData.name },
          validatedData.slug ? { slug: validatedData.slug } : undefined
        ].filter(Boolean) as any
      }
    });

    if (existingCategory) {
      return c.json({ error: "Category with this name already exists" }, 400);
    }

    // Create category
    const category = await prisma.gameCategory.create({
      data: {
        description: validatedData.description,
        metaDescription: validatedData.metaDescription,
        name: validatedData.name,
        slug:
          validatedData.slug ||
          validatedData.name.toLowerCase().replace(/\s+/g, "-")
      }
    });

    logger.info(`Category created: ${category.id} - ${category.name}`);
    return c.json({ category, message: "Category created successfully" }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ details: error.errors, error: "Validation error" }, 400);
    }
    logger.error("Error creating category:", error);
    return c.json({ error: "Failed to create category" }, 500);
  }
};

// Update an existing category
export const updateCategory = async (c: Context) => {
  try {
    const categoryId = c.req.param("id");
    const body = await c.req.json();
    const validatedData = updateCategorySchema.parse({
      ...body,
      id: categoryId
    });

    // Check if category exists
    const existingCategory = await prisma.gameCategory.findUnique({
      where: { id: categoryId }
    });

    if (!existingCategory) {
      return c.json({ error: "Category not found" }, 404);
    }

    // Check if name is being changed and if it conflicts
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameConflict = await prisma.gameCategory.findUnique({
        where: { name: validatedData.name }
      });
      if (nameConflict)
        return c.json({ error: "Category with this name already exists" }, 400);
    }
    if (validatedData.slug && validatedData.slug !== existingCategory.slug) {
      const slugConflict = await prisma.gameCategory.findUnique({
        where: { slug: validatedData.slug }
      });
      if (slugConflict)
        return c.json({ error: "Category with this slug already exists" }, 400);
    }

    // Update category
    const updatedCategory = await prisma.gameCategory.update({
      data: {
        description: validatedData.description,
        metaDescription: validatedData.metaDescription,
        name: validatedData.name,
        slug: validatedData.slug
      },
      where: { id: categoryId }
    });

    logger.info(
      `Category updated: ${updatedCategory.id} - ${updatedCategory.name}`
    );
    return c.json({
      category: updatedCategory,
      message: "Category updated successfully"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ details: error.errors, error: "Validation error" }, 400);
    }
    logger.error("Error updating category:", error);
    return c.json({ error: "Failed to update category" }, 500);
  }
};

// Delete a category
export const deleteCategory = async (c: Context) => {
  try {
    const categoryId = c.req.param("id");

    // Check if category exists
    const existingCategory = await prisma.gameCategory.findUnique({
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
      return c.json(
        {
          error: "Cannot delete category with games",
          gameCount: existingCategory._count.games
        },
        400
      );
    }

    // Delete category
    await prisma.gameCategory.delete({
      where: { id: categoryId }
    });

    logger.info(`Category deleted: ${categoryId} - ${existingCategory.name}`);
    return c.json({ message: "Category deleted successfully" });
  } catch (error) {
    logger.error("Error deleting category:", error);
    return c.json({ error: "Failed to delete category" }, 500);
  }
};

// Get category statistics
export const getCategoryStats = async (c: Context) => {
  try {
    const categories = await prisma.gameCategory.findMany({
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
    const totalGames = categories.reduce(
      (sum, cat) => sum + cat._count.games,
      0
    );
    const averageGamesPerCategory =
      totalCategories > 0 ? totalGames / totalCategories : 0;

    return c.json({
      categories,
      stats: {
        averageGamesPerCategory:
          Math.round(averageGamesPerCategory * 100) / 100,
        totalCategories,
        totalGames
      }
    });
  } catch (error) {
    logger.error("Error fetching category stats:", error);
    return c.json({ error: "Failed to fetch category statistics" }, 500);
  }
};
