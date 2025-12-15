import React from "react";

import Link from "next/link";

import { FlickeringGrid } from "../ui/flickering-grid";
import { Meteors } from "../ui/meteors";
import RvyuFuzzy from "./rvyu-fuzzy";

const Footer = () => {
  return (
    <footer className="px-6 py-16">
      <div className="relative container mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-12 overflow-hidden text-center">
        <Meteors number={10} angle={75} />
        <div className="via-muted absolute inset-x-0 top-0 h-px bg-linear-to-l from-transparent to-transparent"></div>
        <div className="text-muted-foreground pointer-events-none z-10 flex w-full items-center justify-center pt-20 font-serif text-[6rem] leading-tight font-bold tracking-wide max-sm:text-[6rem]">
          <RvyuFuzzy />
        </div>

        <ul className="relative z-20 items-center gap-1 sm:flex">
          <li>
            <span className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors">
              Copyright © BMSCE.tech All rights reserved.
            </span>
          </li>
          <li>
            <Link
              href="/privacys"
              className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              Terms of Service
            </Link>
          </li>
        </ul>
        <FlickeringGrid
          className="absolute mask-[radial-gradient(180px_circle_at_center,white,transparent)]"
          squareSize={4}
          gridGap={6}
          color="#00a6f4"
          maxOpacity={0.4}
          flickerChance={0.08}
        />
      </div>
    </footer>
  );
};

export default Footer;
