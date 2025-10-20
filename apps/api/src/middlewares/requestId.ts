import { randomUUID } from "node:crypto";
import type { Context, Next } from "hono";

const requestId = async (c: Context, next: Next) => {
  const existing = c.req.header("x-request-id");
  const id = existing || randomUUID();
  c.set("requestId", id);
  c.header("x-request-id", id);
  return next();
};

export default requestId;
