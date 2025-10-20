import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { moderateRateLimit } from "../../middlewares/rateLimiter";
import getOembed from "./getOembed";

const app = new Hono();

app.get(
  "/get",
  moderateRateLimit,
  zValidator("query", z.object({ url: z.string().url() })),
  getOembed
);

export default app;
