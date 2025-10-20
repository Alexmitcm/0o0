interface Counters {
  total: number;
  s2xx: number;
  s3xx: number;
  s4xx: number;
  s5xx: number;
  s429: number;
}

interface RouteMetrics {
  counters: Counters;
  // Keep a rolling reservoir of up to N latencies (ms)
  latencies: number[];
}

const MAX_LATENCIES = 512;

const byRoute = new Map<string, RouteMetrics>();

const getKey = (method: string, path: string): string =>
  `${method.toUpperCase()} ${path}`;

const getRoute = (method: string, path: string): RouteMetrics => {
  const key = getKey(method, path);
  let rm = byRoute.get(key);
  if (!rm) {
    rm = {
      counters: { s2xx: 0, s3xx: 0, s4xx: 0, s5xx: 0, s429: 0, total: 0 },
      latencies: []
    };
    byRoute.set(key, rm);
  }
  return rm;
};

const record = (
  method: string,
  path: string,
  status: number,
  latencyMs: number
) => {
  const rm = getRoute(method, path);
  rm.counters.total += 1;
  if (status >= 200 && status < 300) rm.counters.s2xx += 1;
  else if (status >= 300 && status < 400) rm.counters.s3xx += 1;
  else if (status === 429) {
    rm.counters.s4xx += 1;
    rm.counters.s429 += 1;
  } else if (status >= 400 && status < 500) rm.counters.s4xx += 1;
  else if (status >= 500) rm.counters.s5xx += 1;

  rm.latencies.push(latencyMs);
  if (rm.latencies.length > MAX_LATENCIES) {
    rm.latencies.splice(0, rm.latencies.length - MAX_LATENCIES);
  }
};

const percentile = (arr: number[], p: number): number | null => {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((p / 100) * sorted.length))
  );
  return sorted[idx];
};

const snapshot = () => {
  const out: Record<
    string,
    {
      counters: Counters;
      p50: number | null;
      p95: number | null;
      p99: number | null;
      latenciesSmall: number[];
    }
  > = {};
  for (const [key, rm] of byRoute.entries()) {
    out[key] = {
      counters: rm.counters,
      latenciesSmall: rm.latencies.slice(-50),
      p50: percentile(rm.latencies, 50),
      p95: percentile(rm.latencies, 95),
      p99: percentile(rm.latencies, 99)
    };
  }
  return { generatedAt: new Date().toISOString(), routes: out };
};

export default { record, snapshot };
