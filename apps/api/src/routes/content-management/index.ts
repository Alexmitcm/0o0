import logger from "@hey/helpers/logger";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { errorHandler } from "../../middlewares/errorHandler";
import rateLimiter from "../../middlewares/rateLimiter";
import prisma from "../../prisma/client";

const contentManagementRouter = new Hono();

// Validation schemas
const createSlideSchema = z.object({
  endTime: z.string().datetime(),
  imageData: z.string(), // Base64 encoded image
  imageType: z.string().min(1),
  startTime: z.string().datetime(),
  title: z.string().min(1).max(200)
});

const updateSlideSchema = z.object({
  endTime: z.string().datetime().optional(),
  imageData: z.string().optional(),
  imageType: z.string().min(1).optional(),
  startTime: z.string().datetime().optional(),
  title: z.string().min(1).max(200).optional()
});

// GET /content-management/hero-slides - Get hero slides (equivalent to get_hero_slides.php)
contentManagementRouter.get(
  "/hero-slides",
  rateLimiter({ max: 30, windowMs: 60000 }),
  async (c) => {
    try {
      const now = new Date();

      const slides = await prisma.heroSlide.findMany({
        orderBy: { startTime: "asc" },
        where: {
          endTime: {
            gt: now
          }
        }
      });

      const processedSlides = slides.map((slide) => ({
        active: slide.endTime > now ? 1 : 0,
        end_time: slide.endTime,
        id: slide.id,
        image_base64: `data:${slide.imageType};base64,${slide.imageData}`,
        start_time: slide.startTime,
        title: slide.title
      }));

      return c.json({ slides: processedSlides });
    } catch (error) {
      logger.error("Error getting hero slides:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /content-management/hero-slides - Create hero slide
contentManagementRouter.post(
  "/hero-slides",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator("json", createSlideSchema),
  async (c) => {
    try {
      const { title, startTime, endTime, imageData, imageType } =
        c.req.valid("json");

      const slide = await prisma.heroSlide.create({
        data: {
          endTime: new Date(endTime),
          imageData,
          imageType,
          startTime: new Date(startTime),
          title
        }
      });

      return c.json(
        {
          data: slide,
          success: true
        },
        201
      );
    } catch (error) {
      logger.error("Error creating hero slide:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// PUT /content-management/hero-slides/:id - Update hero slide
contentManagementRouter.put(
  "/hero-slides/:id",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator("json", updateSlideSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const updateData: any = {};
      if (data.title) updateData.title = data.title;
      if (data.startTime) updateData.startTime = new Date(data.startTime);
      if (data.endTime) updateData.endTime = new Date(data.endTime);
      if (data.imageData) updateData.imageData = data.imageData;
      if (data.imageType) updateData.imageType = data.imageType;

      const slide = await prisma.heroSlide.update({
        data: updateData,
        where: { id }
      });

      return c.json({
        data: slide,
        success: true
      });
    } catch (error) {
      logger.error("Error updating hero slide:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// DELETE /content-management/hero-slides/:id - Delete hero slide
contentManagementRouter.delete(
  "/hero-slides/:id",
  rateLimiter({ max: 10, windowMs: 60000 }),
  async (c) => {
    try {
      const id = c.req.param("id");

      await prisma.heroSlide.delete({
        where: { id }
      });

      return c.json({
        message: "Hero slide deleted successfully",
        success: true
      });
    } catch (error) {
      logger.error("Error deleting hero slide:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// GET /content-management/slides - Get regular slides
contentManagementRouter.get(
  "/slides",
  rateLimiter({ max: 30, windowMs: 60000 }),
  async (c) => {
    try {
      const slides = await prisma.slide.findMany({
        orderBy: { createdAt: "desc" }
      });

      return c.json({ slides });
    } catch (error) {
      logger.error("Error getting slides:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /content-management/slides - Create regular slide
contentManagementRouter.post(
  "/slides",
  rateLimiter({ max: 10, windowMs: 60000 }),
  zValidator(
    "json",
    z.object({
      description: z.string().optional(),
      imageData: z.string(),
      imageType: z.string().min(1),
      isActive: z.boolean().default(true),
      title: z.string().min(1).max(200)
    })
  ),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const slide = await prisma.slide.create({
        data: {
          description: data.description,
          imageData: data.imageData,
          imageType: data.imageType,
          isActive: data.isActive,
          title: data.title
        }
      });

      return c.json(
        {
          data: slide,
          success: true
        },
        201
      );
    } catch (error) {
      logger.error("Error creating slide:", error);
      return errorHandler(error as Error, c);
    }
  }
);

// POST /content-management/upload-banner - Upload banner (equivalent to upload_banner.php)
contentManagementRouter.post(
  "/upload-banner",
  rateLimiter({ max: 5, windowMs: 60000 }),
  async (c) => {
    try {
      const formData = await c.req.formData();
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const imageFile = formData.get("image") as File;

      if (!imageFile) {
        return c.json({ error: "No image file provided" }, 400);
      }

      // Convert file to base64
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const imageType = imageFile.type;

      const slide = await prisma.slide.create({
        data: {
          description: description || "",
          imageData: base64,
          imageType,
          isActive: true,
          title: title || "Banner"
        }
      });

      return c.json(
        {
          data: slide,
          success: true
        },
        201
      );
    } catch (error) {
      logger.error("Error uploading banner:", error);
      return errorHandler(error as Error, c);
    }
  }
);

export default contentManagementRouter;
