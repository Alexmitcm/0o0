import { Component, type ReactNode } from "react";
import { Button } from "@/components/Shared/UI/Button";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("GameHub Error Boundary caught an error:", error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ error: undefined, hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-[#121212] p-4">
          <div className="max-w-md text-center">
            <div className="mb-6 text-6xl">⚠️</div>
            <h2 className="mb-4 font-bold text-2xl text-white">
              Something went wrong
            </h2>
            <p className="mb-6 text-gray-400">
              We encountered an error while loading the GameHub. Please try
              again.
            </p>

            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="mb-2 cursor-pointer text-gray-500 text-sm">
                  Error Details
                </summary>
                <div className="rounded border bg-gray-800 p-3 text-gray-600 text-xs">
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.message}
                    {"\n\n"}
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={this.handleRetry} variant="primary">
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} variant="ghost">
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
