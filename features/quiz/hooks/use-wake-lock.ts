"use client";

import { useEffect, useRef } from "react";

function isWakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

/**
 * Keeps the screen awake while `active` is true (e.g. for the duration of a
 * live quiz session). The Wake Lock API auto-releases the lock when the tab
 * is backgrounded, so this re-acquires it on visibilitychange. No-ops on
 * browsers without Wake Lock support (e.g. older Android WebViews).
 */
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || !isWakeLockSupported()) return;

    let cancelled = false;

    const acquire = async () => {
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
      } catch (err) {
        console.warn("Screen Wake Lock request failed:", err);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !sentinelRef.current) {
        void acquire();
      }
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      if (sentinel) void sentinel.release();
    };
  }, [active]);
}
