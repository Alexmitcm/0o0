import type { FallbackTransport } from "viem";
import { fallback, http } from "viem";

// Get API URL from environment or use default
const getApiUrl = () => {
  // Check if we're in development mode
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return "http://localhost:8080";
  }

  // For production, use the Railway URL
  return "https://gamehub4-production.up.railway.app";
};

const BATCH_SIZE = 10;

const getRpcWithProxy = (): FallbackTransport => {
  // Use the API proxy endpoint instead of direct RPC calls
  const proxyRpc = `${getApiUrl()}/rpc`;

  return fallback([
    http(proxyRpc, {
      batch: { batchSize: BATCH_SIZE },
      // Add timeout to prevent hanging requests
      timeout: 30000
    })
  ]);
};

export default getRpcWithProxy;
