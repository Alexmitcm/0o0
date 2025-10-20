import { type FC, useEffect, useRef, useState } from "react";

interface RobustVideoProps {
  src: string;
  fallbackSrc?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  "aria-label"?: string;
  onLoadSuccess?: () => void;
  onLoadFailure?: () => void;
}

const RobustVideo: FC<RobustVideoProps> = ({
  src,
  fallbackSrc,
  className = "",
  autoPlay = false,
  loop = false,
  muted = true,
  playsInline = true,
  "aria-label": ariaLabel,
  onLoadSuccess,
  onLoadFailure
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxRetries = 2;

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.warn("Video error:", e);

    if (retryCount < maxRetries) {
      // Try to reload the video
      setTimeout(() => {
        if (videoRef.current) {
          setRetryCount((prev) => prev + 1);
          videoRef.current.load();
        }
      }, 1000);
    } else {
      setHasError(true);
      setIsLoading(false);
      onLoadFailure?.();
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
    onLoadSuccess?.();
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
  }, [src]);

  if (hasError) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800`}
      >
        <div className="p-8 text-center text-white/60">
          <div className="mb-2">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Video unavailable</title>
              <path
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
              />
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
              />
            </svg>
          </div>
          <p className="text-sm">Video temporarily unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <video
        aria-label={ariaLabel}
        autoPlay={autoPlay}
        className="absolute inset-0 h-full w-full object-cover"
        loop={loop}
        muted={muted}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onLoadedData={handleLoadedData}
        onLoadStart={handleLoadStart}
        playsInline={playsInline}
        preload="metadata"
        ref={videoRef}
      >
        <source src={src} type="video/webm" />
        {fallbackSrc && <source src={fallbackSrc} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>

      {/* Loading indicator */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
          <div className="text-center text-white/60">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-white/40 border-b-2" />
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RobustVideo;
