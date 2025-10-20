// More aggressive console override to suppress ALL iframe/ad-related errors
export const setupConsoleOverride = () => {
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalInfo = console.info;

  // Create a more aggressive filter
  const shouldSuppress = (message: string) => {
    // Check for any ad-related content
    const adPatterns = [
      /adform\.net/i,
      /plista\.com/i,
      /extend\.tv/i,
      /opera\.com/i,
      /htmlgames\.com/i,
      /cdn\.htmlgames\.com/i,
      /adnxs\.com/i,
      /crwdcntrl\.net/i,
      /rlcdn\.com/i,
      /33across\.com/i,
      /euid\.eu/i,
      /net::ERR_/i,
      /Attestation check/i,
      /Failed to convert value/i,
      /sw\.js/i,
      /async_usersync/i,
      /provider\.js/i,
      /usync\.js/i,
      /pubads_impl\.js/i,
      /load-cookie\.html/i,
      /usermatch/i,
      /cookie_sync/i,
      /loadPixel/i,
      /processPixels/i,
      /queuePixels/i,
      /advertising/i,
      /tracking/i,
      /analytics/i,
      /ads/i,
      /banner/i,
      /pixel/i,
      /beacon/i,
      /script/i,
      /iframe/i,
      /cross-origin/i,
      /CORS/i,
      /XMLHttpRequest/i,
      /fetch/i,
      /GET https?:\/\/[^/]*(ad|track|analytics|ads|marketing|affiliate)\./i,
      /hxkk:1/i,
      /Topics on https/i,
      /cdn\.htmlgames\.com/i,
      /ads\.pubmatic\.com/i,
      /favicon\.ico/i,
      /inpage\.js/i,
      /pubmatic/i,
      /AdServer/i,
      /topics\/favicon/i
    ];

    return adPatterns.some((pattern) => pattern.test(message));
  };

  // Override console methods
  console.error = (...args: any[]) => {
    const message = args.join(" ");
    if (shouldSuppress(message)) {
      return; // Suppress
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const message = args.join(" ");
    if (shouldSuppress(message)) {
      return; // Suppress
    }
    originalWarn.apply(console, args);
  };

  console.log = (...args: any[]) => {
    const message = args.join(" ");
    if (shouldSuppress(message)) {
      return; // Suppress
    }
    originalLog.apply(console, args);
  };

  console.info = (...args: any[]) => {
    const message = args.join(" ");
    if (shouldSuppress(message)) {
      return; // Suppress
    }
    originalInfo.apply(console, args);
  };

  // Also override window.onerror to catch uncaught errors
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const errorMessage = `${message} at ${source}:${lineno}:${colno}`;
    if (shouldSuppress(errorMessage)) {
      return true; // Prevent default error handling
    }
    if (originalOnError) {
      return originalOnError.call(
        window,
        message,
        source,
        lineno,
        colno,
        error
      );
    }
    return false;
  };

  // Override unhandledrejection to catch Promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const message = event.reason?.toString() || "";
    if (shouldSuppress(message)) {
      event.preventDefault();
      return;
    }
  });

  // Log that the override is active
  originalLog(
    "🔇 Aggressive console override activated - suppressing all iframe/ad-related errors"
  );
};

export default setupConsoleOverride;
