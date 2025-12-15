"use client";

import { useEffect } from "react";

import FAQSection from "@/features/landing/components/faq-section";
import FeaturesSection from "@/features/landing/components/features-section";
import HeroSection from "@/features/landing/components/hero-section";

const MainPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="relative">
      <HeroSection />
      <FeaturesSection />
      <FAQSection />
    </div>
  );
};

export default MainPage;
