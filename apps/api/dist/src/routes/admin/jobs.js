"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_validator_1 = require("@hono/zod-validator");
const hono_1 = require("hono");
const zod_1 = require("zod");
const rateLimiter_1 = require("../../middlewares/rateLimiter");
const security_1 = require("../../middlewares/security");
const queueRegistry_1 = require("../../services/bullmq/queueRegistry");
const app = new hono_1.Hono();
// Apply admin authentication to all routes
app.use("*", security_1.adminOnly);
const queueParam = zod_1.z.object({ queueName: zod_1.z.string().min(1) });
const jobParam = zod_1.z.object({
    jobId: zod_1.z.string().min(1),
    queueName: zod_1.z.string().min(1)
});
app.get("/queues", rateLimiter_1.moderateRateLimit, async (c) => {
    const names = await (0, queueRegistry_1.getQueueNames)();
    return c.json({ queues: names });
});
app.get("/overview", rateLimiter_1.moderateRateLimit, async (c) => {
    const names = await (0, queueRegistry_1.getQueueNames)();
    const overviews = await Promise.all(names.map((n) => (0, queueRegistry_1.getQueueOverview)(n)));
    return c.json({ queues: overviews });
});
app.get("/queue/:queueName", rateLimiter_1.moderateRateLimit, (0, zod_validator_1.zValidator)("param", queueParam), async (c) => {
    const { queueName } = c.req.valid("param");
    const status = (c.req.query("status") || "waiting");
    const page = Number.parseInt(c.req.query("page") || "1", 10);
    const limit = Number.parseInt(c.req.query("limit") || "20", 10);
    const queue = (0, queueRegistry_1.getQueue)(queueName);
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    const jobs = await queue.getJobs([status], start, end);
    const total = await queue.getJobCountByTypes(status);
    return c.json({
        jobs: jobs.map((j) => (0, queueRegistry_1.mapJobSummary)(j, status)),
        pagination: {
            limit,
            page,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit))
        }
    });
});
app.get("/job/:queueName/:jobId", rateLimiter_1.moderateRateLimit, (0, zod_validator_1.zValidator)("param", jobParam), async (c) => {
    const { queueName, jobId } = c.req.valid("param");
    const queue = (0, queueRegistry_1.getQueue)(queueName);
    const job = await queue.getJob(jobId);
    if (!job)
        return c.json({ error: "Job not found" }, 404);
    const logs = await job.getLogs();
    return c.json({
        job: {
            attemptsMade: job.attemptsMade,
            data: job.data,
            failedReason: job.failedReason,
            finishedOn: job.finishedOn,
            id: String(job.id),
            name: job.name,
            opts: job.opts,
            processedOn: job.processedOn,
            progress: job.progress,
            returnvalue: job.returnvalue,
            stacktrace: job.stacktrace,
            timestamp: job.timestamp
        },
        logs
    });
});
app.post("/job/:queueName/:jobId/retry", rateLimiter_1.moderateRateLimit, (0, zod_validator_1.zValidator)("param", jobParam), async (c) => {
    const { queueName, jobId } = c.req.valid("param");
    const queue = (0, queueRegistry_1.getQueue)(queueName);
    const job = await queue.getJob(jobId);
    if (!job)
        return c.json({ error: "Job not found" }, 404);
    await job.retry();
    return c.json({ success: true });
});
app.post("/job/:queueName/:jobId/promote", rateLimiter_1.moderateRateLimit, (0, zod_validator_1.zValidator)("param", jobParam), async (c) => {
    const { queueName, jobId } = c.req.valid("param");
    const queue = (0, queueRegistry_1.getQueue)(queueName);
    const job = await queue.getJob(jobId);
    if (!job)
        return c.json({ error: "Job not found" }, 404);
    await job.promote();
    return c.json({ success: true });
});
app.post("/job/:queueName/:jobId/discard", rateLimiter_1.moderateRateLimit, (0, zod_validator_1.zValidator)("param", jobParam), async (c) => {
    const { queueName, jobId } = c.req.valid("param");
    const queue = (0, queueRegistry_1.getQueue)(queueName);
    const job = await queue.getJob(jobId);
    if (!job)
        return c.json({ error: "Job not found" }, 404);
    await job.discard();
    return c.json({ success: true });
});
app.delete("/job/:queueName/:jobId", rateLimiter_1.moderateRateLimit, (0, zod_validator_1.zValidator)("param", jobParam), async (c) => {
    const { queueName, jobId } = c.req.valid("param");
    const queue = (0, queueRegistry_1.getQueue)(queueName);
    const job = await queue.getJob(jobId);
    if (!job)
        return c.json({ error: "Job not found" }, 404);
    const maybeRemoveOnQueue = queue.remove;
    if (typeof maybeRemoveOnQueue === "function") {
        await maybeRemoveOnQueue.call(queue, jobId);
    }
    else if (typeof job.remove === "function") {
        await job.remove();
    }
    return c.json({ success: true });
});
app.post("/queue/:queueName/pause", rateLimiter_1.moderateRateLimit, (0, zod_validator_1.zValidator)("param", queueParam), async (c) => {
    const { queueName } = c.req.valid("param");
    const queue = (0, queueRegistry_1.getQueue)(queueName);
    await queue.pause();
    return c.json({ success: true });
});
app.post("/queue/:queueName/resume", rateLimiter_1.moderateRateLimit, (0, zod_validator_1.zValidator)("param", queueParam), async (c) => {
    const { queueName } = c.req.valid("param");
    const queue = (0, queueRegistry_1.getQueue)(queueName);
    await queue.resume();
    return c.json({ success: true });
});
app.post("/queue/:queueName/drain", rateLimiter_1.moderateRateLimit, (0, zod_validator_1.zValidator)("param", queueParam), async (c) => {
    const { queueName } = c.req.valid("param");
    const queue = (0, queueRegistry_1.getQueue)(queueName);
    await queue.drain(true);
    return c.json({ success: true });
});
exports.default = app;
