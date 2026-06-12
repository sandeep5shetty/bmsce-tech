"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  enterFullscreen,
  exitFullscreen,
  isFullscreenSupported,
  isInFullscreen,
} from "@/features/quiz/lib/fullscreen";

export type FullscreenViolation = "left_fullscreen";

function isTabVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

function isWindowFocused(): boolean {
  if (typeof document === "undefined") return true;
  return isTabVisible() && document.hasFocus();
}

export function useQuizFullscreen(active: boolean) {
  const [fullscreenEngaged, setFullscreenEngaged] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTabVisibleState, setIsTabVisibleState] = useState(true);
  const [isWindowActive, setIsWindowActive] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [entering, setEntering] = useState(false);
  const [showStrictWarning, setShowStrictWarning] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [supported] = useState(() => isFullscreenSupported());

  const wasActiveRef = useRef(false);
  const tabSwitchStrikesRef = useRef(0);
  const pendingTabSwitchRef = useRef(false);
  const prevTabVisibleRef = useRef(true);

  const syncFullscreen = useCallback(() => {
    setIsFullscreen(isInFullscreen());
  }, []);

  const syncTabVisible = useCallback(() => {
    setIsTabVisibleState(isTabVisible());
  }, []);

  const syncWindowActive = useCallback(() => {
    setIsWindowActive(isWindowFocused());
  }, []);

  useEffect(() => {
    syncFullscreen();
    syncTabVisible();
    syncWindowActive();

    const onFullscreenChange = () => syncFullscreen();
    const onVisibilityChange = () => {
      syncTabVisible();
      syncWindowActive();
    };
    const onWindowFocusChange = () => syncWindowActive();
    const onPageHide = () => {
      syncTabVisible();
      setIsWindowActive(false);
    };
    const onPageShow = () => {
      syncTabVisible();
      syncWindowActive();
    };
    const onFreeze = () => {
      syncTabVisible();
      setIsWindowActive(false);
    };
    const onResume = () => {
      syncTabVisible();
      syncWindowActive();
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("freeze", onFreeze);
    document.addEventListener("resume", onResume);
    window.addEventListener("blur", onWindowFocusChange);
    window.addEventListener("focus", onWindowFocusChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);

    const focusInterval = window.setInterval(() => {
      syncTabVisible();
      syncWindowActive();
    }, 100);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("freeze", onFreeze);
      document.removeEventListener("resume", onResume);
      window.removeEventListener("blur", onWindowFocusChange);
      window.removeEventListener("focus", onWindowFocusChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      window.clearInterval(focusInterval);
    };
  }, [syncFullscreen, syncTabVisible, syncWindowActive]);

  useEffect(() => {
    if (active && isInFullscreen()) {
      setFullscreenEngaged(true);
      setFocusMode(true);
    }
  }, [active]);

  useEffect(() => {
    if (wasActiveRef.current && !active) {
      void exitFullscreen();
      setFullscreenEngaged(false);
      setFocusMode(false);
      setShowStrictWarning(false);
      tabSwitchStrikesRef.current = 0;
      pendingTabSwitchRef.current = false;
    }
    wasActiveRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!active || !fullscreenEngaged || isRemoved) return;

    const wasVisible = prevTabVisibleRef.current;
    const nowVisible = isTabVisibleState;

    if (wasVisible && !nowVisible) {
      if (showStrictWarning || tabSwitchStrikesRef.current >= 1) {
        setIsRemoved(true);
        pendingTabSwitchRef.current = false;
      } else {
        pendingTabSwitchRef.current = true;
      }
    }

    if (!wasVisible && nowVisible && pendingTabSwitchRef.current) {
      pendingTabSwitchRef.current = false;
      setShowStrictWarning(true);
    }

    prevTabVisibleRef.current = nowVisible;
  }, [isTabVisibleState, active, fullscreenEngaged, isRemoved, showStrictWarning]);

  const handleEnterFullscreen = useCallback(async () => {
    setEntering(true);
    try {
      if (supported) {
        const entered = await enterFullscreen();
        if (entered) {
          setFullscreenEngaged(true);
          setFocusMode(true);
        }
      } else {
        setFullscreenEngaged(true);
        setFocusMode(true);
      }
    } finally {
      setEntering(false);
      syncFullscreen();
      syncWindowActive();
    }
  }, [supported, syncFullscreen, syncWindowActive]);

  const acknowledgeStrictWarning = useCallback(async () => {
    tabSwitchStrikesRef.current = 1;
    setShowStrictWarning(false);
    await handleEnterFullscreen();
  }, [handleEnterFullscreen]);

  const fullscreenViolation: FullscreenViolation | null =
    active &&
    fullscreenEngaged &&
    isWindowActive &&
    supported &&
    !isFullscreen
      ? "left_fullscreen"
      : null;

  const showEnterPrompt = active && !fullscreenEngaged && !isRemoved;

  const showOverlay =
    showEnterPrompt ||
    showStrictWarning ||
    isRemoved ||
    fullscreenViolation !== null;

  const interactionLocked =
    showOverlay || !isTabVisibleState || isRemoved;

  return {
    supported,
    showEnterPrompt,
    showStrictWarning,
    isRemoved,
    violation: fullscreenViolation,
    entering,
    handleEnterFullscreen,
    acknowledgeStrictWarning,
    isBlocking: interactionLocked,
    showOverlay,
  };
}
