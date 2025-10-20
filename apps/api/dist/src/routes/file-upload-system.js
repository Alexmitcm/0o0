"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const fs_1 = require("fs");
const path_1 = require("path");
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const ApiError_1 = require("../errors/ApiError");
const handleApiError_1 = __importDefault(require("../utils/handleApiError"));
const prisma = new client_1.PrismaClient();
const fileUpload = new hono_1.Hono();
// Validation schemas
const uploadBannerSchema = zod_1.z.object({
    imageData: zod_1.z.string(), // Base64 image data
    mobileImageData: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true),
    endTime: zod_1.z.string().datetime().optional(),
});
const uploadSlideSchema = zod_1.z.object({
    imageData: zod_1.z.string(), // Base64 image data
    mobileUrl: zod_1.z.string().optional(),
    desktopUrl: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true),
});
const deleteBannerSchema = zod_1.z.object({
    id: zod_1.z.string(),
});
// Helper function to save base64 image
async function saveBase64Image(base64Data, filename) {
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    // Create uploads directory if it doesn't exist
    const uploadsDir = (0, path_1.join)(process.cwd(), 'uploads');
    if (!(0, fs_1.existsSync)(uploadsDir)) {
        (0, fs_1.mkdirSync)(uploadsDir, { recursive: true });
    }
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = base64Data.includes('data:image/png') ? 'png' : 'jpg';
    const uniqueFilename = `${filename}_${timestamp}.${fileExtension}`;
    const filePath = (0, path_1.join)(uploadsDir, uniqueFilename);
    // Save file
    const buffer = Buffer.from(base64, 'base64');
    await new Promise((resolve, reject) => {
        const stream = (0, fs_1.createWriteStream)(filePath);
        stream.write(buffer);
        stream.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
    // Return public URL
    return `/uploads/${uniqueFilename}`;
}
// Helper function to delete file
async function deleteFile(filePath) {
    try {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const fullPath = (0, path_1.join)(process.cwd(), filePath.replace('/uploads/', 'uploads/'));
        if ((0, fs_1.existsSync)(fullPath)) {
            await fs.unlink(fullPath);
        }
    }
    catch (error) {
        console.error('Error deleting file:', error);
    }
}
// POST /upload-banner - Upload banner image
fileUpload.post('/upload-banner', authMiddleware_1.default, async (c) => {
    try {
        const body = await c.req.json();
        const { imageData, mobileImageData, isActive, endTime } = uploadBannerSchema.parse(body);
        // Save desktop image
        const desktopUrl = await saveBase64Image(imageData, 'banner_desktop');
        // Save mobile image if provided
        let mobileUrl;
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
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /upload-hero-slide - Upload hero slide
fileUpload.post('/upload-hero-slide', authMiddleware_1.default, async (c) => {
    try {
        const body = await c.req.json();
        const { imageData, isActive, endTime } = zod_1.z.object({
            imageData: zod_1.z.string(),
            isActive: zod_1.z.boolean().default(true),
            endTime: zod_1.z.string().datetime().optional()
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
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
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
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
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
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// DELETE /banner/:id - Delete banner
fileUpload.delete('/banner/:id', authMiddleware_1.default, async (c) => {
    try {
        const id = c.req.param('id');
        const slide = await prisma.slide.findUnique({
            where: { id }
        });
        if (!slide) {
            throw new ApiError_1.ApiError('Banner not found', 404);
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
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// DELETE /hero-slide/:id - Delete hero slide
fileUpload.delete('/hero-slide/:id', authMiddleware_1.default, async (c) => {
    try {
        const id = c.req.param('id');
        const heroSlide = await prisma.heroSlide.findUnique({
            where: { id }
        });
        if (!heroSlide) {
            throw new ApiError_1.ApiError('Hero slide not found', 404);
        }
        // Delete database record
        await prisma.heroSlide.delete({
            where: { id }
        });
        return c.json({
            success: true,
            message: 'Hero slide deleted successfully'
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// PUT /banner/:id/toggle - Toggle banner active status
fileUpload.put('/banner/:id/toggle', authMiddleware_1.default, async (c) => {
    try {
        const id = c.req.param('id');
        const slide = await prisma.slide.findUnique({
            where: { id }
        });
        if (!slide) {
            throw new ApiError_1.ApiError('Banner not found', 404);
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
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// PUT /hero-slide/:id/toggle - Toggle hero slide active status
fileUpload.put('/hero-slide/:id/toggle', authMiddleware_1.default, async (c) => {
    try {
        const id = c.req.param('id');
        const heroSlide = await prisma.heroSlide.findUnique({
            where: { id }
        });
        if (!heroSlide) {
            throw new ApiError_1.ApiError('Hero slide not found', 404);
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
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
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
            throw new ApiError_1.ApiError('Banner not found', 404);
        }
        return c.json({
            success: true,
            slide
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
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
            throw new ApiError_1.ApiError('Hero slide not found', 404);
        }
        return c.json({
            success: true,
            heroSlide: {
                ...heroSlide,
                imageData: `data:image/jpeg;base64,${heroSlide.imageData}`
            }
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// POST /bulk-upload - Bulk upload banners
fileUpload.post('/bulk-upload', authMiddleware_1.default, async (c) => {
    try {
        const body = await c.req.json();
        const { banners } = zod_1.z.object({
            banners: zod_1.z.array(zod_1.z.object({
                imageData: zod_1.z.string(),
                mobileImageData: zod_1.z.string().optional(),
                isActive: zod_1.z.boolean().default(true)
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
                let mobileUrl;
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
            }
            catch (error) {
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
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
// GET /stats - Get upload statistics
fileUpload.get('/stats', authMiddleware_1.default, async (c) => {
    try {
        const [totalBanners, activeBanners, totalHeroSlides, activeHeroSlides] = await Promise.all([
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
    }
    catch (error) {
        return (0, handleApiError_1.default)(c, error);
    }
});
exports.default = fileUpload;
