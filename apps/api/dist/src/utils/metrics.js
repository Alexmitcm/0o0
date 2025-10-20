"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MAX_LATENCIES = 512;
const byRoute = new Map();
const getKey = (method, path) => `${method.toUpperCase()} ${path}`;
const getRoute = (method, path) => {
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
const record = (method, path, status, latencyMs) => {
    const rm = getRoute(method, path);
    rm.counters.total += 1;
    if (status >= 200 && status < 300)
        rm.counters.s2xx += 1;
    else if (status >= 300 && status < 400)
        rm.counters.s3xx += 1;
    else if (status === 429) {
        rm.counters.s4xx += 1;
        rm.counters.s429 += 1;
    }
    else if (status >= 400 && status < 500)
        rm.counters.s4xx += 1;
    else if (status >= 500)
        rm.counters.s5xx += 1;
    rm.latencies.push(latencyMs);
    if (rm.latencies.length > MAX_LATENCIES) {
        rm.latencies.splice(0, rm.latencies.length - MAX_LATENCIES);
    }
};
const percentile = (arr, p) => {
    if (arr.length === 0)
        return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
    return sorted[idx];
};
const snapshot = () => {
    const out = {};
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
exports.default = { record, snapshot };
