import * as React from "react";

import { cn } from "@/lib/utils";

const spinnerSizes = {
  xs: "h-3 w-3 border-2",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
  xl: "h-14 w-14 border-4",
} as const;

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: keyof typeof spinnerSizes;
  label?: string;
}

export function Spinner({
  size = "md",
  label = "Loading",
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent text-primary",
        spinnerSizes[size],
        className,
      )}
      {...props}
    />
  );
}
