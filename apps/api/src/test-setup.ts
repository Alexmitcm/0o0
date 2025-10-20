// Test setup file for Vitest
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

// Global test setup
beforeAll(async () => {
  // Setup test environment
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL =
    process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  process.env.SUPABASE_URL =
    process.env.SUPABASE_URL || "https://test.supabase.co";
  process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || "test-key";
});

afterAll(async () => {
  // Cleanup after all tests
});

beforeEach(() => {
  // Setup before each test
});

afterEach(() => {
  // Cleanup after each test
});
