"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGameReport = exports.getGameReports = void 0;
const client_1 = __importDefault(require("../../prisma/client"));
const getGameReports = async (c) => {
    try {
        const { limit = 50, offset = 0, reason } = c.req.query();
        const where = {};
        if (reason) {
            where.reason = reason;
        }
        const reports = await client_1.default.gameReport.findMany({
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
        const total = await client_1.default.gameReport.count({ where });
        return c.json({ reports, total });
    }
    catch (error) {
        console.error("Get game reports error:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
};
exports.getGameReports = getGameReports;
const deleteGameReport = async (c) => {
    try {
        const reportId = c.req.param("id");
        const report = await client_1.default.gameReport.findUnique({
            where: { id: reportId }
        });
        if (!report) {
            return c.json({ error: "Report not found" }, 404);
        }
        await client_1.default.gameReport.delete({
            where: { id: reportId }
        });
        return c.json({ success: true });
    }
    catch (error) {
        console.error("Delete game report error:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
};
exports.deleteGameReport = deleteGameReport;
