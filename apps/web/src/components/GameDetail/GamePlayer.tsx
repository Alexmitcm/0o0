import { useEffect, useRef, useState, useCallback } from "react";
import { Spinner } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import styles from "./GamePlayer.module.css";

interface GamePlayerProps {
  gameFileUrl: string;
  entryFilePath?: string;
  title: string;
  width: number;
  height: number;
}

const GamePlayer = ({
  gameFileUrl,
  entryFilePath,
  title,
  width,
  height
}: GamePlayerProps) => {
  const { currentAccount } = useAccountStore();
  const [gameContent, setGameContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handleFullscreen = useCallback(() => {
    const el: any = iframeRef.current;
    (
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.msRequestFullscreen
    )?.call(el);
  }, []);

  useEffect(() => {
    const loadGame = async () => {
      try {
        setIsLoading(true);
        setError("");

        // Use the gameFileUrl directly as it already contains the full path
        const isAbsolute = /^https?:\/\//i.test(gameFileUrl);
        const baseApi = import.meta.env.VITE_API_URL || "http://localhost:8080";
        let gameUrl = isAbsolute ? gameFileUrl : `${baseApi}${gameFileUrl}`;

        // Add wallet address parameter if available, otherwise add a placeholder
        const urlObj = new URL(gameUrl, window.location.origin);
        const hasWallet = urlObj.searchParams.has("walletaddress");
        const addr = currentAccount?.address || "guest";
        if (hasWallet) {
          urlObj.searchParams.set("walletaddress", addr);
        } else {
          urlObj.searchParams.append("walletaddress", addr);
        }
        gameUrl = urlObj.toString();

        console.log("🎮 GamePlayer: Loading game from:", gameUrl);
        console.log("🎮 GamePlayer: Game dimensions:", { width, height });
        console.log("🎮 GamePlayer: Current account:", currentAccount);
        setGameContent(gameUrl);
      } catch (err) {
        console.error("Error loading game:", err);
        setError(err instanceof Error ? err.message : "Failed to load game");
      } finally {
        setIsLoading(false);
      }
    };

    if (gameFileUrl) {
      loadGame();
    }
  }, [gameFileUrl, entryFilePath, currentAccount?.address, width, height]);

  useEffect(() => {
    // Cleanup URL on unmount
    return () => {
      if (gameContent?.startsWith("blob:")) {
        URL.revokeObjectURL(gameContent);
      }
    };
  }, [gameContent]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-700">
        <div className="text-center">
          <Spinner size="md" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading game...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-700">
        <div className="text-center">
          <p className="mb-2 text-red-500 dark:text-red-400">
            Failed to load game
          </p>
          <p className="mb-4 text-gray-600 text-sm dark:text-gray-400">
            {error}
          </p>
          <a
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            href={gameFileUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Download Game File
          </a>
        </div>
      </div>
    );
  }

  // Calculate safe dimensions (fallback to 16:9 if missing)
  const hasDimensions = Boolean(width && height);
  const safeWidth = hasDimensions ? width : 1280;
  const safeHeight = hasDimensions ? height : 720;
  const aspectRatio = safeWidth / safeHeight;
  const maxHeight = 600; // Maximum height for the game container
  const maxWidth = maxHeight * aspectRatio;

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="relative overflow-hidden rounded-lg bg-black shadow-lg">
        {/* Game Controls */}
        <div className="pointer-events-auto absolute top-2 right-2 z-20 flex gap-2">
          <a
            aria-label="Open game in new window"
            className="rounded bg-black/60 px-2 py-1 text-white text-xs backdrop-blur transition hover:bg-black/70"
            href={gameContent}
            rel="noopener noreferrer"
            tabIndex={0}
            target="_blank"
          >
            Open
          </a>
          <button
            aria-label="Enter fullscreen"
            className="rounded bg-black/60 px-2 py-1 text-white text-xs backdrop-blur transition hover:bg-black/70"
            onClick={handleFullscreen}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                (e.currentTarget as HTMLButtonElement).click();
            }}
            tabIndex={0}
            type="button"
          >
            Fullscreen
          </button>
        </div>

        {/* Game Container with proper aspect ratio */}
        <div
          className={`${styles.gameIframeContainer} relative w-full ${
            hasDimensions ? styles.gameIframeWithDimensions : "aspect-video"
          }`}
          data-aspect-ratio={`${safeWidth}/${safeHeight}`}
          data-max-height={maxHeight}
          data-max-width={maxWidth}
        >
          {gameContent ? (
            <>
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={`${styles.gameIframe} absolute inset-0 z-0 border-0`}
                loading="lazy"
                onError={(e) => {
                  console.warn("🎮 Iframe error:", e);
                  if (process.env.NODE_ENV === 'development') {
                    console.warn(
                      "Iframe error (this is normal for external games with ads):",
                      e
                    );
                  }
                  // Don't set error for iframe errors as they're usually ad-related
                }}
                onLoad={() => {
                  console.log("🎮 Game iframe loaded successfully");
                  if (process.env.NODE_ENV === 'development') {
                    console.log("Game iframe loaded successfully");
                  }
                  setIsLoading(false);
                }}
                ref={iframeRef}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-pointer-lock allow-orientation-lock allow-presentation allow-downloads allow-top-navigation-by-user-activation"
                src={gameContent}
                title={title}
              />
              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute bottom-2 left-2 z-10 rounded bg-black/70 px-2 py-1 text-white text-xs">
                  Game URL: {gameContent}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-700">
              <div className="text-center">
                <p className="text-gray-500">No game content available</p>
                <p className="text-gray-400 text-sm">gameContent: {gameContent}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePlayer;
