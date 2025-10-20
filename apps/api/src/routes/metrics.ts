import { Hono } from "hono";
import metrics from "../utils/metrics";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ data: metrics.snapshot(), success: true });
});

app.get("/prom", (c) => {
  const snap = metrics.snapshot();

  const escapeLabel = (v: string) =>
    v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const lines: string[] = [];

  lines.push("# HELP route_requests_total Total HTTP requests by route");
  lines.push("# TYPE route_requests_total counter");
  lines.push(
    "# HELP route_requests_status_total HTTP requests by route and status group"
  );
  lines.push("# TYPE route_requests_status_total counter");
  lines.push(
    "# HELP route_requests_latency_ms_p50 Route latency p50 in milliseconds"
  );
  lines.push("# TYPE route_requests_latency_ms_p50 gauge");
  lines.push(
    "# HELP route_requests_latency_ms_p95 Route latency p95 in milliseconds"
  );
  lines.push("# TYPE route_requests_latency_ms_p95 gauge");
  lines.push(
    "# HELP route_requests_latency_ms_p99 Route latency p99 in milliseconds"
  );
  lines.push("# TYPE route_requests_latency_ms_p99 gauge");

  for (const key of Object.keys(snap.routes)) {
    const stats = snap.routes[key];
    const spaceIdx = key.indexOf(" ");
    const method = escapeLabel(spaceIdx > 0 ? key.slice(0, spaceIdx) : "");
    const path = escapeLabel(spaceIdx > 0 ? key.slice(spaceIdx + 1) : key);

    lines.push(
      `route_requests_total{method="${method}",path="${path}"} ${stats.counters.total}`
    );
    lines.push(
      `route_requests_status_total{method="${method}",path="${path}",status_group="2xx"} ${stats.counters.s2xx}`
    );
    lines.push(
      `route_requests_status_total{method="${method}",path="${path}",status_group="3xx"} ${stats.counters.s3xx}`
    );
    lines.push(
      `route_requests_status_total{method="${method}",path="${path}",status_group="4xx"} ${stats.counters.s4xx}`
    );
    lines.push(
      `route_requests_status_total{method="${method}",path="${path}",status_group="5xx"} ${stats.counters.s5xx}`
    );
    lines.push(
      `route_requests_status_total{method="${method}",path="${path}",status_group="429"} ${stats.counters.s429}`
    );

    const p50 = stats.p50 ?? 0;
    const p95 = stats.p95 ?? 0;
    const p99 = stats.p99 ?? 0;
    lines.push(
      `route_requests_latency_ms_p50{method="${method}",path="${path}"} ${p50}`
    );
    lines.push(
      `route_requests_latency_ms_p95{method="${method}",path="${path}"} ${p95}`
    );
    lines.push(
      `route_requests_latency_ms_p99{method="${method}",path="${path}"} ${p99}`
    );
  }

  c.header("content-type", "text/plain; version=0.0.4");
  return c.body(`${lines.join("\n")}\n`);
});

export default app;
