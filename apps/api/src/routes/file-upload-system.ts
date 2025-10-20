import { Hono } from 'hono';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import authMiddleware from '../middlewares/authMiddleware';
import { ApiError } from '../errors/ApiError';
import handleApiError from '../utils/handleApiError';

const prisma = new PrismaClient();
const fileUpload = new Hono();

// Validation schemas
const uploadBannerSchema = z.object({
  imageData: z.string(), // Base64 image data
  mobileImageData: z.string().optional(),
  isActive: z.boolean().default(true),
  endTime: z.string().datetime().optional(),
});

const uploadSlideSchema = z.object({
  imageData: z.string(), // Base64 image data
  mobileUrl: z.string().optional(),
  desktopUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

const deleteBannerSchema = z.object({
  id: z.string(),
});

// Helper function to save base64 image
async function saveBase64Image(base64Data: string, filename: string): Promise<string> {
  // Remove data URL prefix if present
  const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Generate unique filename
  const timestamp = Date.now();
  const fileExtension = base64Data.includes('data:image/png') ? 'png' : 'jpg';
  const uniqueFilename = `${filename}_${timestamp}.${fileExtension}`;
  const filePath = join(uploadsDir, uniqueFilename);
  
  // Save file
  const buffer = Buffer.from(base64, 'base64');
  await new Promise((resolve, reject) => {
    const stream = createWriteStream(filePath);
    stream.write(buffer);
    stream.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
  
  // Return public URL
  return `/uploads/${uniqueFilename}`;
}

// Helper function to delete file
async function deleteFile(filePath: string): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const fullPath = join(process.cwd(), filePath.replace('/uploads/', 'uploads/'));
    if (existsSync(fullPath)) {
      await fs.unlink(fullPath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// POST /upload-banner - Upload banner image
fileUpload.post('/upload-banner', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { imageData, mobileImageData, isActive, endTime } = uploadBannerSchema.parse(body);

    // Save desktop image
    const desktopUrl = await saveBase64Image(imageData, 'banner_desktop');
    
    // Save mobile image if provided
    let mobileUrl: string | undefined;
    if (mobileImageData) {
      mobileUrl = await saveBase64Image(mobileImageData, 'banner_mobile');
    }

    // Create slide record
    const slide = await prisma.slide.create({
      data: {
        imageData: imageData, // Store original base64 data
        mobileUrl,
        desktopUrl,
        isActive
      }
    });

    return c.json({
      success: true,
      message: 'Banner uploaded successfully',
      slide: {
        id: slide.id,
        desktopUrl: slide.desktopUrl,
        mobileUrl: slide.mobileUrl,
        isActive: slide.isActive,
        createdAt: slide.createdAt
      }
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /upload-hero-slide - Upload hero slide
fileUpload.post('/upload-hero-slide', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { imageData, isActive, endTime } = z.object({
      imageData: z.string(),
      isActive: z.boolean().default(true),
      endTime: z.string().datetime().optional()
    }).parse(body);

    // Create hero slide record
    const heroSlide = await prisma.heroSlide.create({
      data: {
        imageData,
        active: isActive,
        endTime: endTime ? new Date(endTime) : null
      }
    });

    return c.json({
      success: true,
      message: 'Hero slide uploaded successfully',
      heroSlide: {
        id: heroSlide.id,
        active: heroSlide.active,
        endTime: heroSlide.endTime,
        createdAt: heroSlide.createdAt
      }
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /banners - Get all banners
fileUpload.get('/banners', async (c) => {
  try {
    const banners = await prisma.slide.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return c.json({
      success: true,
      banners
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /hero-slides - Get hero slides
fileUpload.get('/hero-slides', async (c) => {
  try {
    const now = new Date();
    const heroSlides = await prisma.heroSlide.findMany({
      where: {
        active: true,
        OR: [
          { endTime: null },
          { endTime: { gt: now } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    // Convert to data URI format
    const slidesWithDataUri = heroSlides.map(slide => ({
      id: slide.id,
      imageData: `data:image/jpeg;base64,${slide.imageData}`,
      active: slide.active,
      endTime: slide.endTime,
      createdAt: slide.createdAt
    }));

    return c.json({
      success: true,
      slides: slidesWithDataUri
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// DELETE /banner/:id - Delete banner
fileUpload.delete('/banner/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');

    const slide = await prisma.slide.findUnique({
      where: { id }
    });

    if (!slide) {
      throw new ApiError('Banner not found', 404);
    }

    // Delete associated files
    if (slide.desktopUrl) {
      await deleteFile(slide.desktopUrl);
    }
    if (slide.mobileUrl) {
      await deleteFile(slide.mobileUrl);
    }

    // Delete database record
    await prisma.slide.delete({
      where: { id }
    });

    return c.json({
      success: true,
      message: 'Banner deleted successfully'
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// DELETE /hero-slide/:id - Delete hero slide
fileUpload.delete('/hero-slide/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');

    const heroSlide = await prisma.heroSlide.findUnique({
      where: { id }
    });

    if (!heroSlide) {
      throw new ApiError('Hero slide not found', 404);
    }

    // Delete database record
    await prisma.heroSlide.delete({
      where: { id }
    });

    return c.json({
      success: true,
      message: 'Hero slide deleted successfully'
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// PUT /banner/:id/toggle - Toggle banner active status
fileUpload.put('/banner/:id/toggle', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');

    const slide = await prisma.slide.findUnique({
      where: { id }
    });

    if (!slide) {
      throw new ApiError('Banner not found', 404);
    }

    const updatedSlide = await prisma.slide.update({
      where: { id },
      data: { isActive: !slide.isActive }
    });

    return c.json({
      success: true,
      message: 'Banner status updated',
      slide: {
        id: updatedSlide.id,
        isActive: updatedSlide.isActive
      }
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// PUT /hero-slide/:id/toggle - Toggle hero slide active status
fileUpload.put('/hero-slide/:id/toggle', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');

    const heroSlide = await prisma.heroSlide.findUnique({
      where: { id }
    });

    if (!heroSlide) {
      throw new ApiError('Hero slide not found', 404);
    }

    const updatedHeroSlide = await prisma.heroSlide.update({
      where: { id },
      data: { active: !heroSlide.active }
    });

    return c.json({
      success: true,
      message: 'Hero slide status updated',
      heroSlide: {
        id: updatedHeroSlide.id,
        active: updatedHeroSlide.active
      }
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /banner/:id - Get single banner
fileUpload.get('/banner/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const slide = await prisma.slide.findUnique({
      where: { id }
    });

    if (!slide) {
      throw new ApiError('Banner not found', 404);
    }

    return c.json({
      success: true,
      slide
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /hero-slide/:id - Get single hero slide
fileUpload.get('/hero-slide/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const heroSlide = await prisma.heroSlide.findUnique({
      where: { id }
    });

    if (!heroSlide) {
      throw new ApiError('Hero slide not found', 404);
    }

    return c.json({
      success: true,
      heroSlide: {
        ...heroSlide,
        imageData: `data:image/jpeg;base64,${heroSlide.imageData}`
      }
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /bulk-upload - Bulk upload banners
fileUpload.post('/bulk-upload', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { banners } = z.object({
      banners: z.array(z.object({
        imageData: z.string(),
        mobileImageData: z.string().optional(),
        isActive: z.boolean().default(true)
      }))
    }).parse(body);

    const results = [];
    const errors = [];

    for (let i = 0; i < banners.length; i++) {
      try {
        const banner = banners[i];
        
        // Save desktop image
        const desktopUrl = await saveBase64Image(banner.imageData, `bulk_banner_${i}_desktop`);
        
        // Save mobile image if provided
        let mobileUrl: string | undefined;
        if (banner.mobileImageData) {
          mobileUrl = await saveBase64Image(banner.mobileImageData, `bulk_banner_${i}_mobile`);
        }

        // Create slide record
        const slide = await prisma.slide.create({
          data: {
            imageData: banner.imageData,
            mobileUrl,
            desktopUrl,
            isActive: banner.isActive
          }
        });

        results.push({
          index: i,
          id: slide.id,
          status: 'uploaded'
        });

      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return c.json({
      success: true,
      message: `Processed ${banners.length} banners`,
      results,
      errors
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /stats - Get upload statistics
fileUpload.get('/stats', authMiddleware, async (c) => {
  try {
    const [
      totalBanners,
      activeBanners,
      totalHeroSlides,
      activeHeroSlides
    ] = await Promise.all([
      prisma.slide.count(),
      prisma.slide.count({ where: { isActive: true } }),
      prisma.heroSlide.count(),
      prisma.heroSlide.count({ where: { active: true } })
    ]);

    return c.json({
      success: true,
      stats: {
        totalBanners,
        activeBanners,
        totalHeroSlides,
        activeHeroSlides
      }
    });

  } catch (error) {
    return handleApiError(c, error);
  }
});

export default fileUpload;
