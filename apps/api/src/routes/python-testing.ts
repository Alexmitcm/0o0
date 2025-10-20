import { Hono } from "hono";
import { z } from "zod";
import authMiddleware from "../middlewares/authMiddleware";
import handleApiError from "../utils/handleApiError";

const pythonTesting = new Hono();

// Validation schemas
const testConfigSchema = z.object({
  data: z.record(z.any()).optional(),
  delay: z.number().min(0).max(10).default(0.1),
  endpoint: z.string(),
  headers: z.record(z.string()).optional(),
  iterations: z.number().int().positive().max(1000).default(100),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET")
});

// POST /run-tests - Run automated API tests
pythonTesting.post("/run-tests", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { endpoint, method, data, headers, iterations, delay } =
      testConfigSchema.parse(body);

    const results = {
      delay,
      endpoint,
      iterations,
      method,
      startTime: new Date().toISOString(),
      summary: {
        averageResponseTime: 0,
        failed: 0,
        maxResponseTime: 0,
        minResponseTime: Number.POSITIVE_INFINITY,
        successful: 0,
        total: 0
      },
      tests: [] as any[]
    };

    const responseTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      try {
        const response = await fetch(endpoint, {
          body: data ? JSON.stringify(data) : undefined,
          headers: {
            "Content-Type": "application/json",
            ...headers
          },
          method
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        const testResult = {
          iteration: i + 1,
          responseTime,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          timestamp: new Date().toISOString()
        };

        results.tests.push(testResult);
        results.summary.total++;

        if (response.ok) {
          results.summary.successful++;
        } else {
          results.summary.failed++;
        }

        results.summary.minResponseTime = Math.min(
          results.summary.minResponseTime,
          responseTime
        );
        results.summary.maxResponseTime = Math.max(
          results.summary.maxResponseTime,
          responseTime
        );

        // Add delay between requests
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay * 1000));
        }
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        const testResult = {
          error: error instanceof Error ? error.message : "Unknown error",
          iteration: i + 1,
          responseTime,
          status: 0,
          statusText: "Network Error",
          success: false,
          timestamp: new Date().toISOString()
        };

        results.tests.push(testResult);
        results.summary.total++;
        results.summary.failed++;

        results.summary.minResponseTime = Math.min(
          results.summary.minResponseTime,
          responseTime
        );
        results.summary.maxResponseTime = Math.max(
          results.summary.maxResponseTime,
          responseTime
        );
      }
    }

    // Calculate average response time
    results.summary.averageResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    results.summary.minResponseTime =
      results.summary.minResponseTime === Number.POSITIVE_INFINITY
        ? 0
        : results.summary.minResponseTime;

    results.endTime = new Date().toISOString();
    results.duration =
      new Date(results.endTime).getTime() -
      new Date(results.startTime).getTime();

    return c.json({
      results,
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /test-endpoints - Get available test endpoints
pythonTesting.get("/test-endpoints", authMiddleware, async (c) => {
  try {
    const endpoints = [
      {
        description: "Basic health check endpoint",
        endpoint: "/ping",
        method: "GET",
        name: "Health Check",
        requiresAuth: false
      },
      {
        description: "Detailed system health information",
        endpoint: "/health",
        method: "GET",
        name: "System Health",
        requiresAuth: false
      },
      {
        description: "Register a new user",
        endpoint: "/user-management/signup",
        method: "POST",
        name: "User Signup",
        requiresAuth: false,
        sampleData: {
          email: "test@example.com",
          username: "testuser",
          walletAddress: "0x1234567890123456789012345678901234567890"
        }
      },
      {
        description: "Authenticate user",
        endpoint: "/user-management/signin",
        method: "POST",
        name: "User Signin",
        requiresAuth: false,
        sampleData: {
          password: "password123",
          walletAddress: "0x1234567890123456789012345678901234567890"
        }
      },
      {
        description: "Get user information",
        endpoint: "/user-management/get-user-data",
        method: "POST",
        name: "Get User Data",
        requiresAuth: true,
        sampleData: {
          walletAddress: "0x1234567890123456789012345678901234567890"
        }
      },
      {
        description: "Update user coins",
        endpoint: "/coin-system-enhanced/coin-update",
        method: "POST",
        name: "Coin Update",
        requiresAuth: true,
        sampleData: {
          amount: 100,
          sourceType: "Registration",
          walletAddress: "0x1234567890123456789012345678901234567890"
        }
      },
      {
        description: "Get all tournaments",
        endpoint: "/tournament-system-enhanced/all",
        method: "GET",
        name: "Get All Tournaments",
        requiresAuth: false
      },
      {
        description: "Create a notification",
        endpoint: "/notification-system-enhanced/create",
        method: "POST",
        name: "Create Notification",
        requiresAuth: true,
        sampleData: {
          description: "This is a test notification",
          isAll: true,
          priority: "Normal",
          title: "Test Notification",
          type: "System"
        }
      },
      {
        description: "Admin authentication",
        endpoint: "/admin-panel/login",
        method: "POST",
        name: "Admin Login",
        requiresAuth: false,
        sampleData: {
          password: "admin123",
          username: "admin"
        }
      },
      {
        description: "Get dashboard statistics",
        endpoint: "/analytics/dashboard-stats",
        method: "GET",
        name: "Dashboard Stats",
        requiresAuth: true
      }
    ];

    return c.json({
      endpoints,
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /test-results - Get test results history
pythonTesting.get("/test-results", authMiddleware, async (c) => {
  try {
    const page = Number.parseInt(c.req.query("page") || "1");
    const limit = Number.parseInt(c.req.query("limit") || "20");
    const skip = (page - 1) * limit;

    // In a real implementation, you would store test results in the database
    // For now, we'll return a mock response
    const mockResults = [
      {
        averageResponseTime: 45,
        createdAt: new Date().toISOString(),
        endpoint: "/ping",
        failed: 0,
        id: "1",
        iterations: 100,
        method: "GET",
        successful: 100
      },
      {
        averageResponseTime: 120,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        endpoint: "/user-management/signup",
        failed: 2,
        id: "2",
        iterations: 50,
        method: "POST",
        successful: 48
      }
    ];

    return c.json({
      pagination: {
        limit,
        page,
        pages: Math.ceil(mockResults.length / limit),
        total: mockResults.length
      },
      results: mockResults.slice(skip, skip + limit),
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

// POST /generate-test-script - Generate Python test script
pythonTesting.post("/generate-test-script", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const {
      endpoints,
      iterations = 100,
      delay = 0.1
    } = z
      .object({
        delay: z.number().min(0).max(10).default(0.1),
        endpoints: z.array(z.string()),
        iterations: z.number().int().positive().max(1000).default(100)
      })
      .parse(body);

    const pythonScript = `#!/usr/bin/env python3
"""
0xArena API Test Script
Generated: ${new Date().toISOString()}
"""

import requests
import time
import json
import random
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8080"
ITERATIONS = ${iterations}
DELAY = ${delay}

# Test endpoints
ENDPOINTS = ${JSON.stringify(endpoints)}

# Test data generators
def generate_wallet_address():
    return "0x" + "".join(random.choices("0123456789abcdef", k=40))

def generate_username():
    return "testuser" + str(random.randint(1000, 9999))

def generate_email():
    return f"test{random.randint(1000, 9999)}@example.com"

# Test functions
def test_endpoint(endpoint, method="GET", data=None, headers=None):
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        start_time = time.time()
        
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        end_time = time.time()
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        return {
            "success": response.status_code < 400,
            "status_code": response.status_code,
            "response_time": response_time,
            "response_size": len(response.content),
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "response_time": 0,
            "timestamp": datetime.now().isoformat()
        }

def run_tests():
    """Run all tests"""
    print(f"Starting API tests at {datetime.now()}")
    print(f"Testing {len(ENDPOINTS)} endpoints with {ITERATIONS} iterations each")
    print(f"Delay between requests: {DELAY} seconds")
    print("-" * 50)
    
    results = {}
    
    for endpoint in ENDPOINTS:
        print(f"Testing {endpoint}...")
        endpoint_results = []
        
        for i in range(ITERATIONS):
            # Generate test data based on endpoint
            data = None
            headers = {"Content-Type": "application/json"}
            
            if "signup" in endpoint:
                data = {
                    "username": generate_username(),
                    "walletAddress": generate_wallet_address(),
                    "email": generate_email()
                }
            elif "signin" in endpoint:
                data = {
                    "walletAddress": generate_wallet_address(),
                    "password": "password123"
                }
            elif "coin-update" in endpoint:
                data = {
                    "walletAddress": generate_wallet_address(),
                    "amount": random.randint(1, 1000),
                    "sourceType": "Registration"
                }
            elif "notification" in endpoint:
                data = {
                    "title": f"Test Notification {i}",
                    "description": "This is a test notification",
                    "priority": "Normal",
                    "type": "System",
                    "isAll": True
                }
            
            result = test_endpoint(endpoint, "POST" if data else "GET", data, headers)
            endpoint_results.append(result)
            
            if DELAY > 0:
                time.sleep(DELAY)
        
        # Calculate statistics
        successful = sum(1 for r in endpoint_results if r["success"])
        failed = len(endpoint_results) - successful
        avg_response_time = sum(r["response_time"] for r in endpoint_results) / len(endpoint_results)
        
        results[endpoint] = {
            "total": len(endpoint_results),
            "successful": successful,
            "failed": failed,
            "success_rate": (successful / len(endpoint_results)) * 100,
            "avg_response_time": avg_response_time,
            "results": endpoint_results
        }
        
        print(f"  Success: {successful}/{len(endpoint_results)} ({results[endpoint]['success_rate']:.1f}%)")
        print(f"  Avg Response Time: {avg_response_time:.2f}ms")
    
    print("-" * 50)
    print("Test Summary:")
    for endpoint, stats in results.items():
        print(f"{endpoint}: {stats['successful']}/{stats['total']} ({stats['success_rate']:.1f}%)")
    
    # Save results to file
    with open(f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("Results saved to test_results_*.json")
    return results

if __name__ == "__main__":
    run_tests()
`;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `api_test_script_${timestamp}.py`;

    c.header("Content-Type", "text/plain");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    return c.text(pythonScript);
  } catch (error) {
    return handleApiError(c, error);
  }
});

// GET /test-status - Get current test status
pythonTesting.get("/test-status", authMiddleware, async (c) => {
  try {
    // In a real implementation, you would check for running tests
    const status = {
      activeTests: 0,
      lastTest: null,
      nextScheduledTest: null,
      running: false
    };

    return c.json({
      status,
      success: true
    });
  } catch (error) {
    return handleApiError(c, error);
  }
});

export default pythonTesting;
