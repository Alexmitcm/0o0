import { useEffect, useRef } from "react";

interface AnalyticsEvent {
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

interface AnalyticsTrackerProps {
  userId?: string;
  sessionId: string;
  enabled?: boolean;
}

const AnalyticsTracker = ({
  userId,
  sessionId,
  enabled = true
}: AnalyticsTrackerProps) => {
  const eventsRef = useRef<AnalyticsEvent[]>([]);
  const lastEventTimeRef = useRef<number>(0);

  // Track page view
  const trackPageView = (page: string) => {
    if (!enabled) return;

    const event: AnalyticsEvent = {
      action: "view",
      category: "navigation",
      label: page,
      sessionId,
      timestamp: Date.now(),
      type: "page_view",
      userId
    };

    eventsRef.current.push(event);
    sendEvent(event);
  };

  // Track game interaction
  const trackGameEvent = (
    action: string,
    _gameId: string,
    gameTitle: string
  ) => {
    if (!enabled) return;

    const event: AnalyticsEvent = {
      action,
      category: "game",
      label: gameTitle,
      sessionId,
      timestamp: Date.now(),
      type: "game_interaction",
      userId,
      value: 1
    };

    eventsRef.current.push(event);
    sendEvent(event);
  };

  // Track user action
  const trackUserAction = (
    action: string,
    category: string,
    label?: string
  ) => {
    if (!enabled) return;

    const event: AnalyticsEvent = {
      action,
      category,
      label,
      sessionId,
      timestamp: Date.now(),
      type: "user_action",
      userId
    };

    eventsRef.current.push(event);
    sendEvent(event);
  };

  // Track performance metrics
  const trackPerformance = (metric: string, value: number) => {
    if (!enabled) return;

    const event: AnalyticsEvent = {
      action: metric,
      category: "metrics",
      sessionId,
      timestamp: Date.now(),
      type: "performance",
      userId,
      value
    };

    eventsRef.current.push(event);
    sendEvent(event);
  };

  // Track error
  const trackError = (error: Error, _context?: string) => {
    if (!enabled) return;

    const event: AnalyticsEvent = {
      action: "occurred",
      category: "error",
      label: `${error.name}: ${error.message}`,
      sessionId,
      timestamp: Date.now(),
      type: "error",
      userId
    };

    eventsRef.current.push(event);
    sendEvent(event);
  };

  // Send event to analytics service (debounced)
  const sendEvent = async (event: AnalyticsEvent) => {
    try {
      // Throttle events to avoid spam
      const now = Date.now();
      if (now - lastEventTimeRef.current < 500) {
        return;
      }
      lastEventTimeRef.current = now;

      // Send to analytics endpoint
      await fetch("/api/analytics", {
        body: JSON.stringify(event),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("Failed to send analytics event:", error);
      }
    }
  };

  // Batch send events
  const flushEvents = async () => {
    if (eventsRef.current.length === 0) return;

    try {
      await fetch("/api/analytics/batch", {
        body: JSON.stringify(eventsRef.current),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      eventsRef.current = [];
    } catch (error) {
      console.warn("Failed to flush analytics events:", error);
    }
  };

  // Auto-flush events every 30 seconds
  useEffect(() => {
    const interval = setInterval(flushEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  // Flush events on page unload using sendBeacon when possible
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!enabled || eventsRef.current.length === 0) return;
      try {
        const payload = JSON.stringify(eventsRef.current);
        const blob = new Blob([payload], { type: "application/json" });
        const ok = navigator.sendBeacon?.("/api/analytics/batch", blob);
        if (!ok) {
          // Fallback (best-effort, synchronous)
          void fetch("/api/analytics/batch", {
            body: payload,
            headers: { "Content-Type": "application/json" },
            keepalive: true,
            method: "POST"
          });
        }
        eventsRef.current = [];
      } catch (_) {
        // ignore
      }
    };

    window.addEventListener("visibilitychange", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("visibilitychange", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled]);

  // Expose tracking functions globally for easy access
  useEffect(() => {
    (window as any).analytics = {
      flushEvents,
      trackError,
      trackGameEvent,
      trackPageView,
      trackPerformance,
      trackUserAction
    };

    return () => {
      delete (window as any).analytics;
    };
  }, [userId, sessionId, enabled]);

  return null; // This component doesn't render anything
};

export default AnalyticsTracker;
