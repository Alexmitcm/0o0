import { HEY_API_URL } from "@hey/data/constants";
import { Status } from "@hey/data/enums";
import type { Oembed, STS } from "@hey/types/api";
import { hydrateAuthTokens } from "@/store/persisted/useAuthStore";
import { isTokenExpiringSoon, refreshTokens } from "./tokenManager";

interface ApiConfig {
  baseUrl?: string;
  headers?: HeadersInit;
}

const config: ApiConfig = {
  baseUrl: HEY_API_URL,
  headers: {
    "Content-Type": "application/json"
  }
};

const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const { accessToken, refreshToken } = hydrateAuthTokens();
  let token = accessToken;

  if (token && refreshToken && isTokenExpiringSoon(token)) {
    try {
      token = await refreshTokens(refreshToken);
    } catch {}
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);

  let response: Response;

  try {
    response = await fetch(`${config.baseUrl}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        ...{ "X-Access-Token": token || "" },
        ...config.headers
      },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const result = await response.json();

  // Prefer wrapped success shape
  if (result && result.status === Status.Success) {
    return result.data as T;
  }

  // Accept plain JSON responses from endpoints that don't wrap
  if (result && result.data !== undefined) {
    return result.data as T;
  }

  // If the result looks like the expected payload already (e.g., { games: [...] })
  if (result && result.error === undefined) {
    return result as T;
  }

  throw new Error(result?.error || "Unknown API error");
};

export const hono = {
  auth: {
    exchange: async (payload: {
      accessToken: string;
      refreshToken: string;
    }): Promise<{ accessToken: string; refreshToken: string }> =>
      fetchApi<{ accessToken: string; refreshToken: string }>("/auth", {
        body: JSON.stringify(payload),
        method: "POST"
      })
  },
  collects: {
    create: async (payload: { slug: string }) =>
      fetchApi<{ ok: boolean; skipped?: boolean }>("/collects", {
        body: JSON.stringify(payload),
        method: "POST"
      })
  },
  likes: {
    create: async (payload: { slug: string }) =>
      fetchApi<{ ok: boolean; skipped?: boolean }>("/likes", {
        body: JSON.stringify(payload),
        method: "POST"
      })
  },
  live: {
    create: async (payload: {
      record: boolean;
    }): Promise<{
      id: string;
      playbackId: string;
      streamKey: string;
    }> =>
      fetchApi("/live/create", {
        body: JSON.stringify(payload),
        method: "POST"
      })
  },
  metadata: {
    sts: (): Promise<STS> => {
      return fetchApi<STS>("/metadata/sts", { method: "GET" });
    }
  },
  oembed: {
    get: (url: string): Promise<Oembed> => {
      const encoded = encodeURIComponent(url);
      return fetchApi<Oembed>(`/oembed/get?url=${encoded}`, { method: "GET" });
    }
  },
  posts: {
    create: async (payload: { slug: string; type?: string }) =>
      fetchApi<{ ok: boolean; skipped?: boolean }>("/posts", {
        body: JSON.stringify(payload),
        method: "POST"
      })
  },
  preferences: {
    get: async (): Promise<{ includeLowScore?: boolean; appIcon?: number }> =>
      fetchApi("/preferences", { method: "GET" }),
    update: async (
      payload: Partial<{ includeLowScore: boolean; appIcon: number }>
    ): Promise<{ ok: boolean }> =>
      fetchApi("/preferences/update", {
        body: JSON.stringify(payload),
        method: "POST"
      })
  },
  premium: {
    autoLinkProfile: async (walletAddress: string): Promise<unknown> =>
      fetchApi("/premium/auto-link", {
        body: JSON.stringify({ walletAddress }),
        method: "POST"
      }),
    debug: async (walletAddress: string): Promise<unknown> =>
      fetchApi(`/premium/debug?walletAddress=${walletAddress}`, {
        method: "GET"
      }),
    getAvailableProfiles: async (walletAddress: string): Promise<unknown> =>
      fetchApi(`/premium/available?walletAddress=${walletAddress}`, {
        method: "GET"
      }),
    getUserStatus: async (walletAddress: string): Promise<unknown> =>
      fetchApi(`/premium/status?walletAddress=${walletAddress}`, {
        method: "GET"
      }),
    linkedProfile: async (): Promise<unknown> =>
      fetchApi("/premium/linked-profile", { method: "GET" }),
    linkProfile: async (
      walletAddress: string,
      profileId: string
    ): Promise<unknown> =>
      fetchApi("/premium/link", {
        body: JSON.stringify({ profileId, walletAddress }),
        method: "POST"
      }),
    stats: async (): Promise<unknown> =>
      fetchApi("/premium/stats", { method: "GET" })
  }
};

export default fetchApi;
