import { useCallback, useEffect, useRef, useState } from "react";

interface LoadingOptimizerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minLoadTime?: number;
  className?: string;
}

const LoadingOptimizer = ({
  children,
  fallback = null,
  minLoadTime = 500,
  className = ""
}: LoadingOptimizerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [loadStartTime] = useState(Date.now());
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleLoadComplete = useCallback(() => {
    const loadTime = Date.now() - loadStartTime;
    const remainingTime = Math.max(0, minLoadTime - loadTime);

    setTimeout(() => {
      setIsLoading(false);
      setShowContent(true);
    }, remainingTime);
  }, [loadStartTime, minLoadTime]);

  // Simulate loading completion
  useEffect(() => {
    // Check if all images are loaded
    const root = containerRef.current ?? document;
    const images = root.querySelectorAll("img");
    let loadedImages = 0;

    if (images.length === 0) {
      handleLoadComplete();
      return;
    }

    const checkImageLoad = () => {
      loadedImages++;
      if (loadedImages === images.length) {
        handleLoadComplete();
      }
    };

    for (const img of images as any as HTMLImageElement[]) {
      if (img.complete) {
        checkImageLoad();
      } else {
        img.addEventListener("load", checkImageLoad);
        img.addEventListener("error", checkImageLoad);
      }
    }

    // Fallback timeout
    const timeout = setTimeout(handleLoadComplete, minLoadTime * 2);

    return () => {
      clearTimeout(timeout);
      for (const img of images as any as HTMLImageElement[]) {
        img.removeEventListener("load", checkImageLoad);
        img.removeEventListener("error", checkImageLoad);
      }
    };
  }, [handleLoadComplete, minLoadTime]);

  // Optional: Preload critical resources (guarded by env flag)
  useEffect(() => {
    if (import.meta.env.VITE_ENABLE_CRITICAL_PRELOAD !== "true") return;
    try {
      const criticalCSS = document.createElement("link");
      criticalCSS.rel = "preload";
      criticalCSS.href = "/critical.css";
      criticalCSS.as = "style";
      document.head.appendChild(criticalCSS);

      const criticalFont = document.createElement("link");
      criticalFont.rel = "preload";
      criticalFont.href = "/fonts/inter.woff2";
      criticalFont.as = "font";
      criticalFont.type = "font/woff2";
      criticalFont.crossOrigin = "anonymous";
      document.head.appendChild(criticalFont);
    } catch (_) {
      // ignore
    }
  }, []);

  if (isLoading) {
    return (
      <div className={`loading-optimizer ${className}`} ref={containerRef}>
        {fallback || (
          <div className="flex min-h-screen items-center justify-center bg-[#121212]">
            <div className="text-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
              <p className="text-gray-400">Loading GameHub...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!showContent) {
    return null;
  }

  return (
    <div className={className} ref={containerRef}>
      {children}
    </div>
  );
};

export default LoadingOptimizer;
