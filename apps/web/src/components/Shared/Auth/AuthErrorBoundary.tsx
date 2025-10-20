import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { Component } from "react";

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class AuthErrorBoundary extends Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(
      "🔴 Authentication Error Boundary caught an error:",
      error,
      errorInfo
    );

    // Log to error reporting service in production
    if (process.env.NODE_ENV === "production") {
      // Error reporting service integration can be added here
      console.error("Production error:", { error: error.message, errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-red-800 dark:text-red-200">
                Authentication Error
              </h3>
              <p className="mt-1 text-red-700 text-sm dark:text-red-300">
                Something went wrong with the authentication process. Please try
                refreshing the page.
              </p>
              <button
                className="mt-3 rounded-md bg-red-100 px-3 py-1 text-red-700 text-sm hover:bg-red-200 dark:bg-red-800/50 dark:text-red-300 dark:hover:bg-red-800"
                onClick={() => window.location.reload()}
                type="button"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
