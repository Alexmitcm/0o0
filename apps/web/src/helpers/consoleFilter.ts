// Console filter to suppress common iframe/ad-related errors
export const setupConsoleFilter = () => {
  const originalError = console.error;
  const originalWarn = console.warn;

  // List of error patterns to suppress
  const suppressedPatterns = [
    "Attestation check for Topics",
    "Failed to convert value to 'Response'",
    "net::ERR_FAILED",
    "net::ERR_CONNECTION_CLOSED",
    "403 (Forbidden)",
    "404 (Not Found)",
    "400 (Bad Request)",
    "451 (Unavailable For Legal Reasons)",
    "424 (Failed Dependency)",
    "SecurityError: Failed to read a named property",
    "Blocked a frame with origin",
    "Protocols must match",
    "pubads_impl.js",
    "usync.js",
    "provider.js",
    "sw.js",
    "load-cookie.html",
    "async_usersync.html",
    "adform.net",
    "plista.com",
    "extend.tv",
    "opera.com",
    "htmlgames.com",
    "cdn.htmlgames.com",
    "adnxs.com",
    "crwdcntrl.net",
    "rlcdn.com",
    "33across.com",
    "euid.eu",
    "hxkk:1",
    "Topics on https",
    "cdn.htmlgames.com",
    "ads.pubmatic.com",
    "favicon.ico",
    "inpage.js",
    "pubmatic",
    "AdServer",
    "topics/favicon"
  ];

  const shouldSuppress = (message: string) => {
    // Check if any pattern matches
    const matches = suppressedPatterns.some((pattern) =>
      message.includes(pattern)
    );

    // Also check for common ad-related URLs
    const adUrlPatterns = [
      /https?:\/\/[^/]*(adform|plista|extend|opera|htmlgames|adnxs|crwdcntrl|rlcdn|33across|euid)\./i,
      /GET https?:\/\/[^/]*(adform|plista|extend|opera|htmlgames|adnxs|crwdcntrl|rlcdn|33across|euid)\./i,
      /net::ERR_CONNECTION_CLOSED/i,
      /net::ERR_FAILED/i,
      /403 \(Forbidden\)/i,
      /424 \(Failed Dependency\)/i,
      /451 \(Unavailable For Legal Reasons\)/i
    ];

    const urlMatches = adUrlPatterns.some((pattern) => pattern.test(message));

    return matches || urlMatches;
  };

  console.error = (...args: any[]) => {
    const message = args.join(" ");
    if (shouldSuppress(message)) {
      // Suppress the error
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const message = args.join(" ");
    if (shouldSuppress(message)) {
      // Suppress the warning
      return;
    }
    originalWarn.apply(console, args);
  };

  // Also override console.log for ad-related messages
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    const message = args.join(" ");
    if (shouldSuppress(message)) {
      // Suppress the log
      return;
    }
    originalLog.apply(console, args);
  };

  // Use originalLog to avoid filtering our own message
  originalLog(
    "🔇 Console filter activated - suppressing iframe/ad-related errors"
  );
};

export default setupConsoleFilter;
