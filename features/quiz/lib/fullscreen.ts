export function isFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  return (
    typeof document.documentElement.requestFullscreen === "function" ||
    typeof (document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen === "function"
  );
}

export function isInFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  return !!(
    document.fullscreenElement ||
    (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
  );
}

export async function enterFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return false;

  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
  };

  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return true;
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export async function exitFullscreen(): Promise<void> {
  if (typeof document === "undefined") return;

  const doc = document as Document & {
    webkitFullscreenElement?: Element;
    webkitExitFullscreen?: () => Promise<void>;
  };

  try {
    if (doc.fullscreenElement && doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    }
  } catch {
    // Ignore — browser may reject if not in fullscreen
  }
}
