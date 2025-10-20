"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const secretMiddleware_1 = __importDefault(require("../../middlewares/secretMiddleware"));
const client_1 = __importDefault(require("../../prisma/client"));
const syncSubscribersToGuild_1 = __importDefault(require("./guild/syncSubscribersToGuild"));
const removeExpiredSubscribers_1 = __importDefault(require("./removeExpiredSubscribers"));
const app = new hono_1.Hono();
app.get("/syncSubscribersToGuild", secretMiddleware_1.default, syncSubscribersToGuild_1.default);
app.get("/removeExpiredSubscribers", secretMiddleware_1.default, removeExpiredSubscribers_1.default);
// Flip tournaments by time: Upcoming->Active, Active->Ended
app.post("/flipTournaments", secretMiddleware_1.default, async (c) => {
    const now = new Date();
    const [activated, ended] = await Promise.all([
        client_1.default.tournament.updateMany({
            data: { status: "Active" },
            where: { startDate: { lte: now }, status: "Upcoming" }
        }),
        client_1.default.tournament.updateMany({
            data: { status: "Ended" },
            where: { endDate: { lt: now }, status: "Active" }
        })
    ]);
    return c.json({ activated: activated.count, ended: ended.count });
});
exports.default = app;
