import type { Context } from "hono";
import { z } from "zod";
import prisma from "../../prisma/client";
import { FileService } from "../../services/FileService";

const uploadGameSchema = z.object({
  categories: z.array(z.string()).min(1),
  description: z.string().optional(),
  height: z.number().min(240).max(1080).default(720),
  instructions: z.string().optional(),
  slug: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(100),
  width: z.number().min(320).max(1920).default(1280)
});

export const uploadGame = async (c: Context) => {
  try {
    const walletAddress = c.get("walletAddress");
    if (!walletAddress) {
      return c.json({ error: "Unauthorized - Please sign in" }, 401);
    }

    // Parse form data
    const formData = await c.req.formData();

    // Extract form fields with proper null handling
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description")
      ? (formData.get("description") as string)
      : "";
    const instructions = formData.get("instructions")
      ? (formData.get("instructions") as string)
      : "";
    const width = Number.parseInt(formData.get("width") as string) || 1280;
    const height = Number.parseInt(formData.get("height") as string) || 720;
    const categoriesStr = formData.get("categories") as string;
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
    const existingGame = await prisma.game.findUnique({
      where: { slug: validatedData.slug }
    });

    if (existingGame) {
      return c.json({ error: "Game with this slug already exists" }, 400);
    }

    // Handle file upload
    const gameFile = formData.get("gameFile") as File;
    const cardCoverFile =
      (formData.get("cardCover") as File) || (formData.get("thumb1") as File);
    const thumb2File = (formData.get("thumb2") as File) || null;

    if (!gameFile || !cardCoverFile) {
      return c.json(
        { error: "Game file and a card cover image are required" },
        400
      );
    }

    // Save files locally
    const { basePath, entryFilePath } = await FileService.saveGameFile(
      gameFile,
      validatedData.slug
    );
    const coverUrl = await FileService.saveThumbnail(
      cardCoverFile,
      validatedData.slug,
      "cover"
    );
    const iconUrl = thumb2File
      ? await FileService.saveThumbnail(thumb2File, validatedData.slug, "icon")
      : coverUrl;

    // Get or create categories
    const categoryIds = await Promise.all(
      validatedData.categories.map(async (rawName) => {
        const name = rawName.trim();
        let category = await prisma.gameCategory.findUnique({
          where: { name }
        });

        if (!category) {
          category = await prisma.gameCategory.create({
            data: { name }
          });
        }

        return category.id;
      })
    );

    // Create the game
    const game = await prisma.game.create({
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
  } catch (error) {
    console.error("Upload game error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ details: error.errors, error: "Validation error" }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
};
