import type { Context } from "hono";
import prisma from "../../prisma/client";

export const getGameReports = async (c: Context) => {
  try {
    const { limit = 50, offset = 0, reason } = c.req.query();

    const where: any = {};
    if (reason) {
      where.reason = reason;
    }

    const reports = await prisma.gameReport.findMany({
      include: {
        game: {
          select: {
            id: true,
            slug: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: Number.parseInt(offset),
      take: Number.parseInt(limit),
      where
    });

    const total = await prisma.gameReport.count({ where });

    return c.json({ reports, total });
  } catch (error) {
    console.error("Get game reports error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const deleteGameReport = async (c: Context) => {
  try {
    const reportId = c.req.param("id");

    const report = await prisma.gameReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return c.json({ error: "Report not found" }, 404);
    }

    await prisma.gameReport.delete({
      where: { id: reportId }
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete game report error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};
