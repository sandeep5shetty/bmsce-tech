"use client";

import { useTheme } from "next-themes";

import { Toaster as Sonner, type ToasterProps } from "sonner";

import { Error, Info, Loader, Tick, Warning } from "../icons";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      position="bottom-center"
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <Tick className="size-4 text-green-400" />,
        info: <Info className="size-4 text-blue-400" />,
        warning: <Warning className="size-4 text-yellow-400" />,
        error: <Error className="size-4 text-red-400" />,
        loading: <Loader className="size-4" />,
      }}
      toastOptions={{
        classNames: {
          title: "font-medium",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
