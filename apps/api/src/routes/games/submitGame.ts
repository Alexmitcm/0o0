import type { Context } from "hono";
import { z } from "zod";
import prisma from "../../prisma/client";
import { FileService } from "../../services/FileService";

const submitGameSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(10).max(1000),
  developer: z.string().max(100).optional(),
  gameType: z.enum(["html5", "unity", "phaser", "construct3", "other"]),
  instructions: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(10),
  title: z.string().min(1).max(100),
  version: z.string().max(20).optional(),
  walletAddress: z.string().min(1),
  website: z.string().url().optional()
});

export const submitGame = async (c: Context) => {
  try {
    const walletAddress = c.get("walletAddress");
    if (!walletAddress) {
      return c.json({ error: "Unauthorized - Please sign in" }, 401);
    }

    // Parse form data
    const formData = await c.req.formData();

    // Extract form fields
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const gameType = formData.get("gameType") as string;
    const category = formData.get("category") as string;
    const tagsStr = formData.get("tags") as string;
    const tags = tagsStr ? JSON.parse(tagsStr) : [];
    const website = formData.get("website") as string;
    const developer = formData.get("developer") as string;
    const version = formData.get("version") as string;
    const instructions = formData.get("instructions") as string;

    const validatedData = submitGameSchema.parse({
      category,
      description,
      developer,
      gameType,
      instructions,
      tags,
      title,
      version,
      walletAddress,
      website
    });

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);

    // Check if game with slug already exists
    const existingGame = await prisma.game.findUnique({
      where: { slug }
    });

    if (existingGame) {
      return c.json({ error: "Game with this title already exists" }, 400);
    }

    // Handle file uploads
    const gameFile = formData.get("gameFile") as File;
    const thumbnailFile = formData.get("thumbnail") as File;
    const screenshots = formData.getAll("screenshots") as File[];

    if (!gameFile) {
      return c.json({ error: "Game file is required" }, 400);
    }

    // Save game file
    const { basePath, entryFilePath } = await FileService.saveGameFile(
      gameFile,
      slug
    );

    // Save thumbnail if provided
    let coverImageUrl = "";
    if (thumbnailFile) {
      coverImageUrl = await FileService.saveThumbnail(
        thumbnailFile,
        slug,
        "cover"
      );
    }

    // Save screenshots if provided
    const screenshotUrls: string[] = [];
    for (let i = 0; i < Math.min(screenshots.length, 5); i++) {
      const screenshotUrl = await FileService.saveThumbnail(
        screenshots[i],
        `${slug}-screenshot-${i + 1}`,
        "screenshot"
      );
      screenshotUrls.push(screenshotUrl);
    }

    // Get or create category
    let categoryRecord = await prisma.gameCategory.findUnique({
      where: { name: validatedData.category }
    });

    if (!categoryRecord) {
      categoryRecord = await prisma.gameCategory.create({
        data: {
          description: `${validatedData.category} games`,
          icon: "🎮",
          name: validatedData.category,
          slug: validatedData.category.toLowerCase().replace(/\s+/g, "-")
        }
      });
    }

    // Create game tags
    const gameTags = await Promise.all(
      validatedData.tags.map(async (tagName) => {
        let tag = await prisma.gameTag.findUnique({
          where: { name: tagName }
        });

        if (!tag) {
          tag = await prisma.gameTag.create({
            data: {
              name: tagName,
              slug: tagName.toLowerCase().replace(/\s+/g, "-")
            }
          });
        }

        return tag;
      })
    );

    // Create the game
    const game = await prisma.game.create({
      data: {
        categories: {
          connect: [{ id: categoryRecord.id }]
        },
        coverImageUrl,
        description: validatedData.description,
        developer: validatedData.developer || "",
        entryFilePath,
        GameTag: {
          connect: gameTags.map((tag) => ({ id: tag.id }))
        },
        gameType: validatedData.gameType,
        height: 720,
        iconUrl: coverImageUrl,
        instructions: validatedData.instructions || "",
        // Store screenshots as JSON in a text field for now
        // In a real implementation, you'd want a separate screenshots table
        metadata: JSON.stringify({
          screenshots: screenshotUrls,
          submittedAt: new Date().toISOString(),
          submittedBy: walletAddress
        }),
        packageUrl: basePath,
        slug,
        status: "Pending", // Set status to Pending for review
        title: validatedData.title,
        version: validatedData.version || "1.0.0",
        website: validatedData.website || "",
        width: 1280
      },
      include: {
        categories: true,
        GameTag: true
      }
    });

    return c.json(
      {
        gameId: game.id,
        message: "Game submitted successfully for review",
        success: true
      },
      201
    );
  } catch (error) {
    console.error("Submit game error:", error);
    if (error instanceof z.ZodError) {
      return c.json(
        {
          details: error.errors,
          error: "Validation error"
        },
        400
      );
    }
    return c.json({ error: "Internal server error" }, 500);
  }
};
