"use client";

import React from "react";

import { AppProgressProvider } from "@bprogress/next";

const ProgessProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProgressProvider
      height="2px"
      color="var(--primary)"
      options={{ showSpinner: false }}
    >
      {children}
    </AppProgressProvider>
  );
};

export default ProgessProvider;
