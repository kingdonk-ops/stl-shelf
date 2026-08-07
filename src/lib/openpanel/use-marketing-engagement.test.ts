import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateReadProgress, createVisibleEngagementTimer } from "./use-marketing-engagement";

function setVisibilityState(state: "hidden" | "visible") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  setVisibilityState("visible");
});

afterEach(() => {
  vi.useRealTimers();
});

describe("calculateReadProgress", () => {
  it("counts the visible viewport toward reading progress", () => {
    expect(calculateReadProgress(0, 800, 2_000)).toBe(0.4);
    expect(calculateReadProgress(200, 800, 2_000)).toBe(0.5);
  });

  it("clamps progress to the zero-to-one range", () => {
    expect(calculateReadProgress(-1_000, 500, 2_000)).toBe(0);
    expect(calculateReadProgress(5_000, 500, 2_000)).toBe(1);
  });

  it("handles an empty document without reporting engagement", () => {
    expect(calculateReadProgress(0, 800, 0)).toBe(0);
  });
});

describe("createVisibleEngagementTimer", () => {
  it("counts only visible time before reaching the threshold", () => {
    setVisibilityState("hidden");
    const onThresholdReached = vi.fn();
    const timer = createVisibleEngagementTimer(onThresholdReached);

    timer.resume();
    vi.advanceTimersByTime(30_000);
    expect(onThresholdReached).not.toHaveBeenCalled();

    setVisibilityState("visible");
    timer.resume();
    vi.advanceTimersByTime(29_999);
    expect(onThresholdReached).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onThresholdReached).toHaveBeenCalledTimes(1);
  });

  it("pauses and resumes across visibility changes", () => {
    const onThresholdReached = vi.fn();
    const timer = createVisibleEngagementTimer(onThresholdReached);

    timer.resume();
    vi.advanceTimersByTime(10_000);
    setVisibilityState("hidden");
    timer.pause();
    vi.advanceTimersByTime(60_000);

    setVisibilityState("visible");
    timer.resume();
    vi.advanceTimersByTime(19_999);
    expect(onThresholdReached).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onThresholdReached).toHaveBeenCalledTimes(1);
  });

  it("fires only once even when resumed repeatedly", () => {
    const onThresholdReached = vi.fn();
    const timer = createVisibleEngagementTimer(onThresholdReached);

    timer.resume();
    vi.advanceTimersByTime(30_000);
    timer.pause();
    timer.resume();
    vi.advanceTimersByTime(30_000);

    expect(onThresholdReached).toHaveBeenCalledTimes(1);
  });

  it("does not reset visible time on a duplicate resume", () => {
    const onThresholdReached = vi.fn();
    const timer = createVisibleEngagementTimer(onThresholdReached);

    timer.resume();
    vi.advanceTimersByTime(10_000);
    timer.resume();
    vi.advanceTimersByTime(19_999);
    expect(onThresholdReached).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onThresholdReached).toHaveBeenCalledTimes(1);
  });

  it("does not fire after disposal", () => {
    const onThresholdReached = vi.fn();
    const timer = createVisibleEngagementTimer(onThresholdReached);

    timer.resume();
    vi.advanceTimersByTime(10_000);
    timer.dispose();
    vi.advanceTimersByTime(60_000);
    setVisibilityState("hidden");
    timer.resume();
    setVisibilityState("visible");
    timer.resume();

    expect(onThresholdReached).not.toHaveBeenCalled();
  });
});
