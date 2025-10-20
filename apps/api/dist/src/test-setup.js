"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Test setup file for Vitest
const vitest_1 = require("vitest");
// Global test setup
(0, vitest_1.beforeAll)(async () => {
    // Setup test environment
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL =
        process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    process.env.SUPABASE_URL =
        process.env.SUPABASE_URL || "https://test.supabase.co";
    process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || "test-key";
});
(0, vitest_1.afterAll)(async () => {
    // Cleanup after all tests
});
(0, vitest_1.beforeEach)(() => {
    // Setup before each test
});
(0, vitest_1.afterEach)(() => {
    // Cleanup after each test
});
