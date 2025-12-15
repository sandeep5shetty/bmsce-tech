"use client";

import React from "react";

import { useTheme } from "next-themes";

import FuzzyText from "../ui/fuzzy-text";

const RvyuFuzzy = () => {
  const { resolvedTheme } = useTheme();
  const color = resolvedTheme === "dark" ? "#9f9fa9" : "#71717b";
  return (
    <FuzzyText
      className="mx-auto text-xl"
      color={color}
      fontSize="clamp(1.5rem, 8vw, 6rem)"
      baseIntensity={0.08}
      hoverIntensity={0.25}
    >
      BMSCE.tech
    </FuzzyText>
  );
};

export default RvyuFuzzy;
