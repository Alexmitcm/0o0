import type { Context, Next } from "hono";
import logger from "../utils/logger";
import metrics from "../utils/metrics";

const infoLogger = async (c: Context, next: Next) => {
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
  metrics.record(c.req.method, c.req.path, status, Number(timeTakenMs));
  logger.info(message);
};

export default infoLogger;
