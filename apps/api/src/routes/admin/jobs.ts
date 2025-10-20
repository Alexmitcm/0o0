import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { moderateRateLimit } from "../../middlewares/rateLimiter";
import { adminOnly } from "../../middlewares/security";
import {
  getQueue,
  getQueueNames,
  getQueueOverview,
  mapJobSummary
} from "../../services/bullmq/queueRegistry";

const app = new Hono();

// Apply admin authentication to all routes
app.use("*", adminOnly);

const queueParam = z.object({ queueName: z.string().min(1) });
const jobParam = z.object({
  jobId: z.string().min(1),
  queueName: z.string().min(1)
});

app.get("/queues", moderateRateLimit, async (c) => {
  const names = await getQueueNames();
  return c.json({ queues: names });
});

app.get("/overview", moderateRateLimit, async (c) => {
  const names = await getQueueNames();
  const overviews = await Promise.all(names.map((n) => getQueueOverview(n)));
  return c.json({ queues: overviews });
});

app.get(
  "/queue/:queueName",
  moderateRateLimit,
  zValidator("param", queueParam),
  async (c) => {
    const { queueName } = c.req.valid("param");
    const status = (c.req.query("status") || "waiting") as
      | "waiting"
      | "active"
      | "delayed"
      | "completed"
      | "failed"
      | "paused";
    const page = Number.parseInt(c.req.query("page") || "1", 10);
    const limit = Number.parseInt(c.req.query("limit") || "20", 10);

    const queue = getQueue(queueName);
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const jobs = await queue.getJobs([status], start, end);
    const total = await queue.getJobCountByTypes(status);

    return c.json({
      jobs: jobs.map((j) => mapJobSummary(j, status)),
      pagination: {
        limit,
        page,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  }
);

app.get(
  "/job/:queueName/:jobId",
  moderateRateLimit,
  zValidator("param", jobParam),
  async (c) => {
    const { queueName, jobId } = c.req.valid("param");
    const queue = getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (!job) return c.json({ error: "Job not found" }, 404);
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
  }
);

app.post(
  "/job/:queueName/:jobId/retry",
  moderateRateLimit,
  zValidator("param", jobParam),
  async (c) => {
    const { queueName, jobId } = c.req.valid("param");
    const queue = getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (!job) return c.json({ error: "Job not found" }, 404);
    await job.retry();
    return c.json({ success: true });
  }
);

app.post(
  "/job/:queueName/:jobId/promote",
  moderateRateLimit,
  zValidator("param", jobParam),
  async (c) => {
    const { queueName, jobId } = c.req.valid("param");
    const queue = getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (!job) return c.json({ error: "Job not found" }, 404);
    await job.promote();
    return c.json({ success: true });
  }
);

app.post(
  "/job/:queueName/:jobId/discard",
  moderateRateLimit,
  zValidator("param", jobParam),
  async (c) => {
    const { queueName, jobId } = c.req.valid("param");
    const queue = getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (!job) return c.json({ error: "Job not found" }, 404);
    await job.discard();
    return c.json({ success: true });
  }
);

app.delete(
  "/job/:queueName/:jobId",
  moderateRateLimit,
  zValidator("param", jobParam),
  async (c) => {
    const { queueName, jobId } = c.req.valid("param");
    const queue = getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (!job) return c.json({ error: "Job not found" }, 404);
    const maybeRemoveOnQueue = (queue as any).remove;
    if (typeof maybeRemoveOnQueue === "function") {
      await maybeRemoveOnQueue.call(queue, jobId);
    } else if (typeof job.remove === "function") {
      await job.remove();
    }
    return c.json({ success: true });
  }
);

app.post(
  "/queue/:queueName/pause",
  moderateRateLimit,
  zValidator("param", queueParam),
  async (c) => {
    const { queueName } = c.req.valid("param");
    const queue = getQueue(queueName);
    await queue.pause();
    return c.json({ success: true });
  }
);

app.post(
  "/queue/:queueName/resume",
  moderateRateLimit,
  zValidator("param", queueParam),
  async (c) => {
    const { queueName } = c.req.valid("param");
    const queue = getQueue(queueName);
    await queue.resume();
    return c.json({ success: true });
  }
);

app.post(
  "/queue/:queueName/drain",
  moderateRateLimit,
  zValidator("param", queueParam),
  async (c) => {
    const { queueName } = c.req.valid("param");
    const queue = getQueue(queueName);
    await queue.drain(true);
    return c.json({ success: true });
  }
);

export default app;
