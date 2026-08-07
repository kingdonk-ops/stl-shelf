import { useEffect, useRef } from "react";
import { trackMarketingContentEngaged } from "./client-events";
import { useOpenPanelClient } from "./client-provider";

const ENGAGEMENT_DELAY_MS = 30_000;
const ENGAGEMENT_SCROLL_THRESHOLD = 0.5;

export type MarketingContentType = "seo_page" | "legacy_guide" | "guide_directory";

export function calculateReadProgress(
  scrollY: number,
  viewportHeight: number,
  documentHeight: number,
): number {
  if (documentHeight <= 0) return 0;
  return Math.min(1, Math.max(0, (scrollY + viewportHeight) / documentHeight));
}

export function createVisibleEngagementTimer(onThresholdReached: () => void) {
  let visibleElapsedMs = 0;
  let visibleStartedAt: number | null = null;
  let timer: number | null = null;
  let thresholdReached = false;
  let disposed = false;

  const clearEngagementTimer = () => {
    if (timer === null) return;
    window.clearTimeout(timer);
    timer = null;
  };

  const commitVisibleTime = () => {
    if (visibleStartedAt === null) return;

    visibleElapsedMs += Math.max(0, window.performance.now() - visibleStartedAt);
    visibleStartedAt = null;
  };

  const completeThreshold = () => {
    if (thresholdReached || disposed) return;
    thresholdReached = true;
    onThresholdReached();
  };

  const pause = () => {
    commitVisibleTime();
    clearEngagementTimer();
  };

  const resume = () => {
    if (disposed || thresholdReached || document.visibilityState !== "visible") {
      return;
    }
    if (timer !== null || visibleStartedAt !== null) return;

    const remainingMs = ENGAGEMENT_DELAY_MS - visibleElapsedMs;
    if (remainingMs <= 0) {
      completeThreshold();
      return;
    }

    visibleStartedAt = window.performance.now();
    timer = window.setTimeout(() => {
      timer = null;
      commitVisibleTime();
      completeThreshold();
    }, remainingMs);
  };

  const dispose = () => {
    disposed = true;
    pause();
  };

  return { dispose, pause, resume };
}

export function useMarketingEngagement({
  path,
  contentType,
}: {
  path: string;
  contentType: MarketingContentType;
}) {
  const { client } = useOpenPanelClient();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!client) return;

    hasTracked.current = false;
    let timeThresholdReached = false;

    const trackIfEngaged = () => {
      if (hasTracked.current || !timeThresholdReached || document.visibilityState !== "visible") {
        return;
      }

      const progress = calculateReadProgress(
        window.scrollY,
        window.innerHeight,
        document.documentElement.scrollHeight,
      );

      if (progress < ENGAGEMENT_SCROLL_THRESHOLD) return;

      hasTracked.current = true;
      trackMarketingContentEngaged(client, { path, contentType });
    };

    const visibleTimer = createVisibleEngagementTimer(() => {
      timeThresholdReached = true;
      trackIfEngaged();
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        visibleTimer.pause();
        return;
      }

      visibleTimer.resume();
      trackIfEngaged();
    };

    visibleTimer.resume();

    window.addEventListener("scroll", trackIfEngaged, { passive: true });
    window.addEventListener("resize", trackIfEngaged);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      visibleTimer.dispose();
      window.removeEventListener("scroll", trackIfEngaged);
      window.removeEventListener("resize", trackIfEngaged);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [client, contentType, path]);
}
