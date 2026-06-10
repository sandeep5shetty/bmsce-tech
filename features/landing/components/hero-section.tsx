import React from "react";

import Image from "next/image";

import { motion } from "motion/react";

import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { Highlighter } from "@/components/ui/highlighter";
import { Spotlight } from "@/components/ui/spotlight";

import { Contributors } from "@/components/common/Contributors";

import {
  GetStartedButton,
  OpenSourceButton,
} from "@/features/landing/components/get-started-button";

const HeroSection = () => {
  return (
    <section className="relative z-10 mx-auto my-26 flex max-w-6xl flex-col items-center justify-center gap-6 px-4 py-16 text-center max-md:my-8 sm:py-2">
      <Spotlight
        className="-top-40 left-0 md:-top-18 md:left-60"
        fill="#00a6f4"
      />
      <FlickeringGrid
        className="absolute inset-0 -z-10 size-full mask-[radial-gradient(250px_circle_at_center,white,transparent)] sm:mask-[radial-gradient(450px_circle_at_center,white,transparent)]"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.5}
        flickerChance={0.1}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <h1 className="text-muted-foreground relative max-w-4xl font-serif text-4xl font-medium tracking-wide sm:text-5xl md:text-6xl">
          An Open Source <span className="text-foreground z-20">community</span>{" "}
          <span className="text-muted-foreground">for</span>{" "}
          <div className="sticky mt-3 inline-flex shrink-0">
            <Highlighter action="highlight" color="var(--color-border)">
              BMSCE
            </Highlighter>
            <span className="ml-4">Students</span>
          </div>
        </h1>

        <p className="text-muted-foreground max-w-2xl px-2 text-sm sm:px-0 sm:text-base md:text-lg">
          We&apos;re a group of curious builders, developers, and designers
          passionate about open source, innovation, and collaboration.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col gap-3 sm:flex-row sm:gap-4"
      >
        <GetStartedButton />
        <div className="relative">
          <OpenSourceButton />
          <span className="text-muted-foreground/60 pointer-events-none absolute -top-2 left-42 hidden size-full -rotate-20 font-mono text-[10px] sm:block">
            Start <br /> Contributing <br />
          </span>
          <svg
            className="text-muted-foreground/60 left- pointer-events-none absolute top-2 left-26 hidden size-full rotate-190 sm:block"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 323.057 323.057"
            xmlSpace="preserve"
            fill="currentColor"
          >
            <path d="M281.442 256.312c-47.124 59.364-139.536 44.676-160.956-29.376-1.224-3.672-1.836-7.956-2.448-11.628 49.572-11.016 97.92-47.124 102.204-90.576 3.672-39.168-36.108-50.796-62.424-28.764-31.212 26.316-53.244 64.872-55.08 105.875-31.824 4.284-63.036-4.284-80.172-35.496-28.764-52.631 9.792-123.624 61.2-144.432 5.508-1.836 3.06-10.404-2.448-8.568C10.326 33.544-26.394 132.688 21.954 191.439c18.972 22.645 49.572 29.988 81.396 26.316 4.284 41.616 36.72 74.664 75.275 87.516 44.676 14.688 85.68-6.731 111.996-41.616 4.285-5.508-4.896-12.239-9.179-7.343M144.354 132.688c9.792-13.464 22.644-28.764 39.168-34.272 15.911-5.508 21.42 16.524 22.031 26.316.612 12.24-7.956 23.256-15.912 31.824-16.523 18.971-44.063 35.496-72.215 42.839 1.836-23.868 13.464-47.123 26.928-66.707"></path>
            <path d="M315.713 233.668c-17.136 0-34.884 1.224-51.408 5.508-6.731 1.836-3.672 11.016 3.061 9.792 13.464-2.448 27.54-1.836 41.004-1.224-.612 7.955-1.224 16.523-2.448 24.479-1.224 6.12-5.508 15.3-1.836 21.42 1.836 3.061 4.896 3.061 7.956 1.836 7.344-3.06 7.344-15.912 8.568-22.644 1.836-11.017 2.447-21.42 2.447-32.437 0-3.67-3.672-6.73-7.344-6.73"></path>
          </svg>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col gap-2 text-center"
      >
        <span className="text-foreground/70 bg-background dark:text-foreground/60 ml-3 rounded-2xl font-medium">
          Contributors
        </span>
        <Contributors />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="bg-background/50 relative mt-12 w-full max-w-5xl overflow-hidden rounded-xl border p-2 shadow-lg lg:mt-4"
      >
        <div className="from-muted to-muted/50 aspect-video w-full rounded-lg bg-linear-to-br object-cover" />
        <Image
          src={"/preview-temp.png"}
          fill
          className="absolute inset-0 block object-cover dark:hidden"
          alt=""
        />
        <Image
          src={"/preview-dark-temp.png"}
          fill
          className="absolute inset-0 hidden object-cover dark:block"
          alt=""
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
