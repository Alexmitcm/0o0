"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTags = void 0;
const client_1 = __importDefault(require("../../prisma/client"));
const getTags = async (c) => {
    try {
        const tags = await client_1.default.gameTag.findMany({ orderBy: { name: "asc" } });
        return c.json({ tags });
    }
    catch {
        return c.json({ error: "Failed to fetch tags" }, 500);
    }
};
exports.getTags = getTags;
