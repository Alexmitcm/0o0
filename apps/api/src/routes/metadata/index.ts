import { Hono } from "hono";
import authMiddleware from "../../middlewares/authMiddleware";
import { moderateRateLimit } from "../../middlewares/rateLimiter";
import getSTS from "./getSTS";

const app = new Hono();

app.get("/sts", moderateRateLimit, authMiddleware, getSTS);

export default app;
