"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapJobSummary = exports.getQueueOverview = exports.getQueueNames = exports.getQueueEvents = exports.getQueue = exports.getConnection = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL;
const BULLMQ_PREFIX = process.env.BULLMQ_PREFIX || "hey";
const REDIS_ENABLED = Boolean(REDIS_URL);
let sharedConnection = null;
const queueCache = new Map();
const queueEventsCache = new Map();
class InMemoryJob {
    id;
    name;
    data;
    attemptsMade = 0;
    progress = 0;
    failedReason;
    processedOn = null;
    finishedOn = null;
    timestamp = Date.now();
    status = "waiting";
    logs = [];
    constructor(id, name, data) {
        this.id = id;
        this.name = name;
        this.data = data;
    }
    async getLogs() {
        return { logs: this.logs };
    }
    async retry() {
        this.status = "waiting";
        this.attemptsMade += 1;
    }
    async promote() {
        if (this.status === "delayed")
            this.status = "waiting";
    }
    async discard() {
        // no-op placeholder
    }
    async remove() {
        // removal handled by queue
    }
}
class InMemoryQueue {
    name;
    isPausedFlag = false;
    jobs = new Map();
    constructor(name) {
        this.name = name;
    }
    async isPaused() {
        return this.isPausedFlag;
    }
    async pause() {
        this.isPausedFlag = true;
    }
    async resume() {
        this.isPausedFlag = false;
    }
    async drain() {
        // remove waiting jobs
        for (const job of this.jobs.values()) {
            if (job.status === "waiting")
                this.jobs.delete(job.id);
        }
    }
    async remove(id) {
        this.jobs.delete(id);
    }
    async add(name, data) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const job = new InMemoryJob(id, name, data);
        this.jobs.set(id, job);
        return job;
    }
    async getJob(id) {
        return this.jobs.get(id) || null;
    }
    async getJobCountByTypes(type) {
        let count = 0;
        for (const j of this.jobs.values())
            if (j.status === type)
                count += 1;
        return count;
    }
    async getJobCounts(...types) {
        const all = {
            active: 0,
            completed: 0,
            delayed: 0,
            failed: 0,
            paused: 0,
            waiting: 0
        };
        for (const j of this.jobs.values())
            all[j.status] += 1;
        if (!types || types.length === 0)
            return all;
        const filtered = {};
        for (const t of types)
            filtered[t] = all[t] || 0;
        return filtered;
    }
    async getJobs(types, start = 0, end = 19) {
        const allowed = Array.isArray(types) ? types : [types];
        const list = Array.from(this.jobs.values()).filter((j) => allowed.includes(j.status));
        const sliced = list.slice(start, end + 1);
        return sliced;
    }
}
const inMemoryRegistry = new Map();
const getInMemoryQueue = (name) => {
    if (!inMemoryRegistry.has(name))
        inMemoryRegistry.set(name, new InMemoryQueue(name));
    const q = inMemoryRegistry.get(name);
    if (!q)
        throw new Error("Failed to get in-memory queue");
    return q;
};
// seed default queues for better DX
if (!REDIS_ENABLED) {
    const queues = ["default", "email", "notifications", "analytics"];
    for (const queueName of queues) {
        const q = getInMemoryQueue(queueName);
        // Pre-populate with sample jobs for each queue
        if (queueName === "default") {
            void q.add("example", { hello: "world" });
            void q.add("process-data", { data: "sample", userId: 123 });
        }
        else if (queueName === "email") {
            void q.add("send-welcome", { email: "user@example.com", name: "John" });
            void q.add("send-notification", {
                email: "admin@example.com",
                message: "System update"
            });
        }
        else if (queueName === "notifications") {
            void q.add("push-notification", { message: "New message", userId: 456 });
        }
        else if (queueName === "analytics") {
            void q.add("track-event", { event: "page_view", userId: 789 });
        }
    }
}
// ---------------- Connection helpers ----------------
const getConnection = () => {
    if (!REDIS_ENABLED)
        return null;
    if (!sharedConnection) {
        sharedConnection = new ioredis_1.default(REDIS_URL);
    }
    return sharedConnection;
};
exports.getConnection = getConnection;
const getQueue = (name) => {
    if (!REDIS_ENABLED)
        return getInMemoryQueue(name);
    if (queueCache.has(name))
        return queueCache.get(name);
    const queue = new bullmq_1.Queue(name, {
        connection: (0, exports.getConnection)(),
        prefix: BULLMQ_PREFIX
    });
    queueCache.set(name, queue);
    return queue;
};
exports.getQueue = getQueue;
const getQueueEvents = (name) => {
    if (!REDIS_ENABLED)
        return null;
    if (queueEventsCache.has(name))
        return queueEventsCache.get(name);
    const qe = new bullmq_1.QueueEvents(name, {
        connection: (0, exports.getConnection)(),
        prefix: BULLMQ_PREFIX
    });
    queueEventsCache.set(name, qe);
    return qe;
};
exports.getQueueEvents = getQueueEvents;
// Discover queues
const getQueueNames = async () => {
    if (!REDIS_ENABLED) {
        // Return default queues for development
        const defaultQueues = ["default", "email", "notifications", "analytics"];
        return defaultQueues;
    }
    const client = (0, exports.getConnection)();
    const pattern = `${BULLMQ_PREFIX}:*:meta`;
    const names = new Set();
    let cursor = "0";
    do {
        // @ts-ignore ioredis types
        const [next, keys] = await client.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = next;
        for (const key of keys) {
            const parts = key.split(":");
            if (parts.length >= 3) {
                const queueName = parts[1];
                names.add(queueName);
            }
        }
    } while (cursor !== "0");
    return Array.from(names).sort();
};
exports.getQueueNames = getQueueNames;
const getQueueOverview = async (name) => {
    const queue = (0, exports.getQueue)(name);
    const [counts, isPaused] = await Promise.all([
        queue.getJobCounts("waiting", "active", "delayed", "completed", "failed", "paused"),
        queue.isPaused()
    ]);
    return { counts, isPaused, name };
};
exports.getQueueOverview = getQueueOverview;
const mapJobSummary = (job, status) => ({
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason || undefined,
    finishedOn: job.finishedOn ?? null,
    id: String(job.id),
    name: job.name,
    processedOn: job.processedOn ?? null,
    progress: job.progress,
    status,
    timestamp: job.timestamp
});
exports.mapJobSummary = mapJobSummary;
