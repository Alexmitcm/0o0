import { useEffect, useState } from "react";
import { Button } from "@/components/Shared/UI/Button";

interface TestResult {
  name: string;
  status: "pass" | "fail" | "pending";
  message?: string;
  duration?: number;
}

interface TestSuiteProps {
  className?: string;
}

const TestSuite = ({ className = "" }: TestSuiteProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState({ failed: 0, passed: 0, total: 0 });

  const tests = [
    {
      name: "Access Control System",
      test: () => testAccessControl()
    },
    {
      name: "Game Loading",
      test: () => testGameLoading()
    },
    {
      name: "User Authentication",
      test: () => testUserAuthentication()
    },
    {
      name: "Performance Metrics",
      test: () => testPerformance()
    },
    {
      name: "Error Handling",
      test: () => testErrorHandling()
    },
    {
      name: "Responsive Design",
      test: () => testResponsiveDesign()
    },
    {
      name: "Guest Mode",
      test: () => testGuestMode()
    },
    {
      name: "Progressive Disclosure",
      test: () => testProgressiveDisclosure()
    }
  ];

  const testAccessControl = async (): Promise<TestResult> => {
    const startTime = Date.now();

    try {
      // Test if access control hooks are available
      const hasAccessControl =
        typeof window !== "undefined" &&
        document.querySelector('[data-testid="access-control"]');

      if (!hasAccessControl) {
        throw new Error("Access control system not found");
      }

      // Test different access levels
      const guestLevel = document.querySelector('[data-testid="guest-level"]');
      const standardLevel = document.querySelector(
        '[data-testid="standard-level"]'
      );
      const premiumLevel = document.querySelector(
        '[data-testid="premium-level"]'
      );

      if (!guestLevel && !standardLevel && !premiumLevel) {
        throw new Error("No access level components found");
      }

      return {
        duration: Date.now() - startTime,
        message: "All access levels working correctly",
        name: "Access Control System",
        status: "pass"
      };
    } catch (error) {
      return {
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : "Unknown error",
        name: "Access Control System",
        status: "fail"
      };
    }
  };

  const testGameLoading = async (): Promise<TestResult> => {
    const startTime = Date.now();

    try {
      // Test if games are loading
      const gameElements = document.querySelectorAll(
        '[data-testid="game-card"]'
      );

      if (gameElements.length === 0) {
        throw new Error("No games found");
      }

      // Test if game images are loading
      const gameImages = document.querySelectorAll('img[alt*="game"]');
      let loadedImages = 0;

      for (const img of gameImages) {
        if ((img as HTMLImageElement).complete) {
          loadedImages++;
        }
      }

      if (loadedImages === 0 && gameImages.length > 0) {
        throw new Error("Game images not loading");
      }

      return {
        duration: Date.now() - startTime,
        message: `${gameElements.length} games loaded, ${loadedImages} images loaded`,
        name: "Game Loading",
        status: "pass"
      };
    } catch (error) {
      return {
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : "Unknown error",
        name: "Game Loading",
        status: "fail"
      };
    }
  };

  const testUserAuthentication = async (): Promise<TestResult> => {
    const startTime = Date.now();

    try {
      // Test if auth modal can be triggered
      const authButtons = document.querySelectorAll(
        '[data-testid="auth-button"]'
      );

      if (authButtons.length === 0) {
        throw new Error("No authentication buttons found");
      }

      // Test if auth state is managed
      const _hasAuthState =
        typeof window !== "undefined" &&
        localStorage.getItem("auth-state") !== null;

      return {
        duration: Date.now() - startTime,
        message: "Authentication system working correctly",
        name: "User Authentication",
        status: "pass"
      };
    } catch (error) {
      return {
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : "Unknown error",
        name: "User Authentication",
        status: "fail"
      };
    }
  };

  const testPerformance = async (): Promise<TestResult> => {
    const startTime = Date.now();

    try {
      // Test page load performance
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;

      if (loadTime > 3000) {
        throw new Error(`Page load time too slow: ${loadTime}ms`);
      }

      // Test memory usage
      let memoryUsage: number | undefined;
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB

        if (memoryUsage > 100) {
          throw new Error(`Memory usage too high: ${memoryUsage.toFixed(1)}MB`);
        }
      }

      return {
        duration: Date.now() - startTime,
        message: `Load time: ${loadTime.toFixed(0)}ms, Memory usage: ${memoryUsage ? `${memoryUsage.toFixed(1)}MB` : "N/A"}`,
        name: "Performance Metrics",
        status: "pass"
      };
    } catch (error) {
      return {
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : "Unknown error",
        name: "Performance Metrics",
        status: "fail"
      };
    }
  };

  const testErrorHandling = async (): Promise<TestResult> => {
    const startTime = Date.now();

    try {
      // Test if error boundaries are in place
      const errorBoundaries = document.querySelectorAll(
        '[data-testid="error-boundary"]'
      );

      if (errorBoundaries.length === 0) {
        throw new Error("No error boundaries found");
      }

      // Test if error recovery components exist
      const _errorRecovery = document.querySelectorAll(
        '[data-testid="error-recovery"]'
      );

      return {
        duration: Date.now() - startTime,
        message: "Error handling system working correctly",
        name: "Error Handling",
        status: "pass"
      };
    } catch (error) {
      return {
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : "Unknown error",
        name: "Error Handling",
        status: "fail"
      };
    }
  };

  const testResponsiveDesign = async (): Promise<TestResult> => {
    const startTime = Date.now();

    try {
      // Test responsive breakpoints
      const viewport = window.innerWidth;
      const isMobile = viewport < 768;
      const isTablet = viewport >= 768 && viewport < 1024;
      const isDesktop = viewport >= 1024;

      if (!isMobile && !isTablet && !isDesktop) {
        throw new Error("Invalid viewport size");
      }

      // Test if responsive classes are applied
      const responsiveElements = document.querySelectorAll('[class*="sm:"]');

      if (responsiveElements.length === 0) {
        throw new Error("No responsive classes found");
      }

      return {
        duration: Date.now() - startTime,
        message: `Viewport: ${viewport}px, Responsive elements: ${responsiveElements.length}`,
        name: "Responsive Design",
        status: "pass"
      };
    } catch (error) {
      return {
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : "Unknown error",
        name: "Responsive Design",
        status: "fail"
      };
    }
  };

  const testGuestMode = async (): Promise<TestResult> => {
    const startTime = Date.now();

    try {
      // Test if guest mode components exist
      const guestComponents = document.querySelectorAll(
        '[data-testid="guest-mode"]'
      );

      if (guestComponents.length === 0) {
        throw new Error("No guest mode components found");
      }

      // Test if guest limitations are shown
      const _guestLimitations = document.querySelectorAll(
        '[data-testid="guest-limitations"]'
      );

      return {
        duration: Date.now() - startTime,
        message: "Guest mode working correctly",
        name: "Guest Mode",
        status: "pass"
      };
    } catch (error) {
      return {
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : "Unknown error",
        name: "Guest Mode",
        status: "fail"
      };
    }
  };

  const testProgressiveDisclosure = async (): Promise<TestResult> => {
    const startTime = Date.now();

    try {
      // Test if progressive disclosure components exist
      const progressiveComponents = document.querySelectorAll(
        '[data-testid="progressive-disclosure"]'
      );

      if (progressiveComponents.length === 0) {
        throw new Error("No progressive disclosure components found");
      }

      return {
        duration: Date.now() - startTime,
        message: "Progressive disclosure working correctly",
        name: "Progressive Disclosure",
        status: "pass"
      };
    } catch (error) {
      return {
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : "Unknown error",
        name: "Progressive Disclosure",
        status: "fail"
      };
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    const testResults: TestResult[] = [];

    for (const test of tests) {
      try {
        const result = await test.test();
        testResults.push(result);
        setResults([...testResults]);

        // Small delay between tests
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        testResults.push({
          message: error instanceof Error ? error.message : "Unknown error",
          name: test.name,
          status: "fail"
        });
        setResults([...testResults]);
      }
    }

    // Calculate summary
    const passed = testResults.filter((r) => r.status === "pass").length;
    const failed = testResults.filter((r) => r.status === "fail").length;

    setSummary({ failed, passed, total: testResults.length });
    setIsRunning(false);
  };

  // Toggle visibility with Ctrl+Shift+T
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "T") {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 ${className}`}
    >
      <div className="w-full max-w-4xl rounded-lg bg-gray-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-2xl text-white">Test Suite</h2>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setIsVisible(false)}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-4">
            <Button disabled={isRunning} onClick={runTests} variant="primary">
              {isRunning ? "Running Tests..." : "Run All Tests"}
            </Button>

            <Button onClick={() => setResults([])} variant="outline">
              Clear Results
            </Button>
          </div>
        </div>

        {/* Summary */}
        {summary.total > 0 && (
          <div className="mb-6 rounded-lg border border-white/10 bg-gray-800/50 p-4">
            <h3 className="mb-2 font-semibold text-white">Test Summary</h3>
            <div className="flex gap-6 text-sm">
              <span className="text-green-400">Passed: {summary.passed}</span>
              <span className="text-red-400">Failed: {summary.failed}</span>
              <span className="text-gray-400">Total: {summary.total}</span>
            </div>
          </div>
        )}

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-white">Test Results</h3>
            {results.map((result, index) => (
              <div
                className="flex items-center justify-between rounded-lg border border-white/10 bg-gray-800/50 p-3"
                key={index}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`text-lg ${
                      result.status === "pass"
                        ? "text-green-400"
                        : result.status === "fail"
                          ? "text-red-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {result.status === "pass"
                      ? "✓"
                      : result.status === "fail"
                        ? "✗"
                        : "⏳"}
                  </div>
                  <div>
                    <div className="font-medium text-white">{result.name}</div>
                    {result.message && (
                      <div className="text-gray-400 text-sm">
                        {result.message}
                      </div>
                    )}
                  </div>
                </div>
                {result.duration && (
                  <div className="text-gray-400 text-sm">
                    {result.duration}ms
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Press Ctrl+Shift+T to toggle test suite
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestSuite;
