"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@hey/data/constants");
const generateUUID_1 = __importDefault(require("@hey/helpers/generateUUID"));
const handleApiError_1 = __importDefault(require("../../utils/handleApiError"));
const createLive = async (ctx) => {
    try {
        const { record } = await ctx.req.json();
        const account = ctx.get("account");
        const response = await fetch("https://livepeer.studio/api/stream", {
            body: JSON.stringify({
                name: `${account}-${(0, generateUUID_1.default)()}`,
                profiles: [
                    {
                        bitrate: 3000000,
                        fps: 0,
                        height: 720,
                        name: "720p0",
                        width: 1280
                    },
                    {
                        bitrate: 6000000,
                        fps: 0,
                        height: 1080,
                        name: "1080p0",
                        width: 1920
                    }
                ],
                record
            }),
            headers: {
                Authorization: `Bearer ${constants_1.LIVEPEER_KEY}`,
                "content-type": "application/json"
            },
            method: "POST"
        });
        const data = (await response.json());
        if (!response.ok) {
            return ctx.json({
                error: "errors" in data && data.errors?.length > 0
                    ? data.errors[0]
                    : "Failed to create stream",
                success: false
            }, { status: response.status });
        }
        return ctx.json({ data, success: true });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
};
exports.default = createLive;
