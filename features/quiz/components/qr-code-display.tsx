"use client";

import { useEffect, useState } from "react";

import QRCode from "qrcode";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  alt?: string;
}

export function QRCodeDisplay({
  url,
  size = 200,
  alt = "QR Code",
}: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((result) => {
        if (!cancelled) setDataUrl(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [url, size]);

  if (error) {
    return (
      <div
        className="bg-muted text-muted-foreground flex items-center justify-center rounded-md text-sm"
        style={{ width: size, height: size }}
        role="img"
        aria-label="QR code generation failed"
      >
        QR code unavailable
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className="bg-muted flex animate-pulse items-center justify-center rounded-md"
        style={{ width: size, height: size }}
        aria-label="Loading QR code"
        role="img"
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className="rounded-md"
    />
  );
}
