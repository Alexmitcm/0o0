import { Hono } from "hono";
import v2Routes from "./v2";

const app = new Hono();

// Mount v2 routes
app.route("/v2", v2Routes);

export default app;
