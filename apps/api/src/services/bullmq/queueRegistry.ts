import { Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;
const DISABLE_REDIS = process.env.DISABLE_REDIS === "true";
const BULLMQ_PREFIX = process.env.BULLMQ_PREFIX || "hey";
let redisAvailable = Boolean(REDIS_URL) && !DISABLE_REDIS;

let sharedConnection: IORedis | null = null;
const queueCache = new Map<string, any>();
const queueEventsCache = new Map<string, any>();

// ---------------- In-memory fallback ----------------
type InMemoryStatus =
  | "waiting"
  | "active"
  | "delayed"
  | "completed"
  | "failed"
  | "paused";

class InMemoryJob {
  id: string;
  name: string;
  data: any;
  attemptsMade = 0;
  progress: any = 0;
  failedReason?: string;
  processedOn: number | null = null;
  finishedOn: number | null = null;
  timestamp = Date.now();
  status: InMemoryStatus = "waiting";
  logs: string[] = [];

  constructor(id: string, name: string, data: any) {
    this.id = id;
    this.name = name;
    this.data = data;
  }

  async getLogs() {
    return { logs: this.logs } as any;
  }
  async retry() {
    this.status = "waiting";
    this.attemptsMade += 1;
  }
  async promote() {
    if (this.status === "delayed") this.status = "waiting";
  }
  async discard() {
    // no-op placeholder
  }
  async remove() {
    // removal handled by queue
  }
}

class InMemoryQueue {
  name: string;
  isPausedFlag = false;
  private jobs = new Map<string, InMemoryJob>();

  constructor(name: string) {
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
      if (job.status === "waiting") this.jobs.delete(job.id);
    }
  }
  async remove(id: string) {
    this.jobs.delete(id);
  }
  async add(name: string, data: any) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const job = new InMemoryJob(id, name, data);
    this.jobs.set(id, job);
    return job as any;
  }
  async getJob(id: string) {
    return (this.jobs.get(id) as any) || null;
  }
  async getJobCountByTypes(type: InMemoryStatus) {
    let count = 0;
    for (const j of this.jobs.values()) if (j.status === type) count += 1;
    return count;
  }
  async getJobCounts(...types: InMemoryStatus[]) {
    const all: Record<string, number> = {
      active: 0,
      completed: 0,
      delayed: 0,
      failed: 0,
      paused: 0,
      waiting: 0
    };
    for (const j of this.jobs.values()) all[j.status] += 1;
    if (!types || types.length === 0) return all as any;
    const filtered: Record<string, number> = {} as any;
    for (const t of types) filtered[t] = all[t] || 0;
    return filtered as any;
  }
  async getJobs(types: InMemoryStatus[] | InMemoryStatus, start = 0, end = 19) {
    const allowed = Array.isArray(types) ? types : [types];
    const list = Array.from(this.jobs.values()).filter((j) =>
      allowed.includes(j.status)
    );
    const sliced = list.slice(start, end + 1);
    return sliced as any;
  }
}

const inMemoryRegistry = new Map<string, InMemoryQueue>();
const getInMemoryQueue = (name: string) => {
  if (!inMemoryRegistry.has(name))
    inMemoryRegistry.set(name, new InMemoryQueue(name));
  const q = inMemoryRegistry.get(name);
  if (!q) throw new Error("Failed to get in-memory queue");
  return q;
};

// seed default queues for better DX
if (!redisAvailable) {
  const queues = ["default", "email", "notifications", "analytics"];
  for (const queueName of queues) {
    const q = getInMemoryQueue(queueName);
    // Pre-populate with sample jobs for each queue
    if (queueName === "default") {
      void q.add("example", { hello: "world" });
      void q.add("process-data", { data: "sample", userId: 123 });
    } else if (queueName === "email") {
      void q.add("send-welcome", { email: "user@example.com", name: "John" });
      void q.add("send-notification", {
        email: "admin@example.com",
        message: "System update"
      });
    } else if (queueName === "notifications") {
      void q.add("push-notification", { message: "New message", userId: 456 });
    } else if (queueName === "analytics") {
      void q.add("track-event", { event: "page_view", userId: 789 });
    }
  }
}

// ---------------- Connection helpers ----------------
export const getConnection = () => {
  if (!redisAvailable || !REDIS_URL) return null as any;
  if (!sharedConnection) {
    // Use lazy connect; if connection fails, fallback to in-memory
    sharedConnection = new IORedis(REDIS_URL as string, {
      enableReadyCheck: true,
      lazyConnect: true,
      maxRetriesPerRequest: 0
    });
    // Attempt connection once; if it fails, disable redis
    sharedConnection.connect().catch(() => {
      redisAvailable = false;
    });
    // Also listen for error events and disable redis to avoid noisy logs
    sharedConnection.on("error", () => {
      redisAvailable = false;
    });
  }
  return redisAvailable ? sharedConnection : (null as any);
};

export const getQueue = (name: string) => {
  const connection = getConnection();
  if (!connection) return getInMemoryQueue(name) as any;
  if (queueCache.has(name)) return queueCache.get(name);
  const queue = new Queue(name, {
    connection,
    prefix: BULLMQ_PREFIX
  });
  queueCache.set(name, queue);
  return queue;
};

export const getQueueEvents = (name: string) => {
  const connection = getConnection();
  if (!connection) return null as any;
  if (queueEventsCache.has(name)) return queueEventsCache.get(name);
  const qe = new QueueEvents(name, {
    connection,
    prefix: BULLMQ_PREFIX
  });
  queueEventsCache.set(name, qe);
  return qe;
};

// Discover queues
export const getQueueNames = async (): Promise<string[]> => {
  if (!redisAvailable) {
    // Return default queues for development
    const defaultQueues = ["default", "email", "notifications", "analytics"];
    return defaultQueues;
  }
  const client = getConnection();
  const pattern = `${BULLMQ_PREFIX}:*:meta`;
  const names = new Set<string>();
  let cursor = "0";
  do {
    // @ts-expect-error ioredis types
    const [next, keys] = await client.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      100
    );
    cursor = next;
    for (const key of keys as string[]) {
      const parts = key.split(":");
      if (parts.length >= 3) {
        const queueName = parts[1];
        names.add(queueName);
      }
    }
  } while (cursor !== "0");
  return Array.from(names).sort();
};

export interface QueueOverview {
  name: string;
  isPaused: boolean;
  counts: Record<string, number>;
}

export const getQueueOverview = async (
  name: string
): Promise<QueueOverview> => {
  const queue = getQueue(name);
  const [counts, isPaused] = await Promise.all([
    queue.getJobCounts(
      "waiting",
      "active",
      "delayed",
      "completed",
      "failed",
      "paused"
    ),
    queue.isPaused()
  ]);
  return { counts, isPaused, name } as QueueOverview;
};

export interface JobSummary {
  id: string;
  name: string;
  status: string;
  attemptsMade: number;
  progress: number | object | undefined;
  failedReason?: string;
  processedOn?: number | null;
  finishedOn?: number | null;
  timestamp: number;
}

export const mapJobSummary = (job: any, status: string): JobSummary => ({
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
