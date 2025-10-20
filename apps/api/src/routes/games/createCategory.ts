import type { Context } from "hono";
import { z } from "zod";
import prisma from "../../prisma/client";

const createCategorySchema = z.object({
  description: z.string().optional(),
  icon: z.string().optional(),
  name: z.string().min(1).max(50)
});

export const createCategory = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const validatedData = createCategorySchema.parse(body);

    // Check if category already exists
    const existingCategory = await prisma.gameCategory.findUnique({
      where: { name: validatedData.name }
    });

    if (existingCategory) {
      return c.json({ error: "Category already exists" }, 400);
    }

    // Create the category
    const category = await prisma.gameCategory.create({
      data: {
        description: validatedData.description,
        icon: validatedData.icon,
        name: validatedData.name,
        slug: validatedData.name.toLowerCase().replace(/\s+/g, "-")
      }
    });

    return c.json({ category, success: true }, 201);
  } catch (error) {
    console.error("Create category error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ details: error.errors, error: "Validation error" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
};
