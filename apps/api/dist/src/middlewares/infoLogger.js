"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const metrics_1 = __importDefault(require("../utils/metrics"));
const infoLogger = async (c, next) => {
    const start = performance.now();
    const startMem = process.memoryUsage().heapUsed;
    await next();
    const end = performance.now();
    const endMem = process.memoryUsage().heapUsed;
    const timeTakenMs = (end - start).toFixed(2);
    const memoryUsedMb = ((endMem - startMem) / 1024 / 1024).toFixed(2);
    const requestId = c.get("requestId") || "-";
    const message = `[${c.req.method} ${c.req.path}] ➜ ${timeTakenMs}ms, ${memoryUsedMb}mb (rid=${requestId})`;
    const status = c.res.status || 200;
    metrics_1.default.record(c.req.method, c.req.path, status, Number(timeTakenMs));
    logger_1.default.info(message);
};
exports.default = infoLogger;
