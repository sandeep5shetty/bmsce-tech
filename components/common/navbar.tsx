"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getUser } from "@/actions/user";

import { Meteors } from "../ui/meteors";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const Navbar = () => {
  const pathname = usePathname();

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isLanding = pathname === "/";
  const showEffect = !isLanding || isScrolled;

  return (
    <header className="sticky top-3 right-0 left-0 z-50 px-5">
      <nav
        className={`relative container mx-auto flex items-center justify-between overflow-hidden rounded-2xl bg-linear-to-br px-6 py-3 backdrop-blur-sm transition-all duration-300 sm:rounded-3xl sm:py-4 ${
          showEffect
            ? `from-background to-background/10 border shadow-md ${isLanding ? "max-w-5xl" : "max-w-6xl"}`
            : "max-w-4xl border-transparent shadow-none"
        }`}
      >
        {showEffect && <Meteors number={10} angle={70} />}

        {/* Gradient overlay */}
        {showEffect && (
          <div className="from-primary/5 pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br via-transparent to-transparent sm:rounded-3xl" />
        )}

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-2">
          <Image
            src="/bmsce.svg"
            alt="Logo"
            width={32}
            height={32}
            className="sm:h-9 sm:w-9"
          />
          <span className="font-serif text-lg font-semibold sm:text-xl">
            <span className="tracking-widest">BMSCE</span>.tech
          </span>
        </Link>

        {/* Navigation Links */}
        <ul className="relative hidden items-center gap-1 sm:flex">
          {isLanding && (
            <>
              <li>
                <Link
                  href="#features"
                  className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors">
                      Pricing
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    don&apos;t worry, it&apos;s completely free 😌
                  </TooltipContent>
                </Tooltip>
              </li>
            </>
          )}
          <li>
            <Link
              href="/placement"
              className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              Placements
            </Link>
          </li>
          <li>
            <Link
              href="/questions"
              className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              Polls
            </Link>
          </li>
          <li>
            <Link
              href="/random-picker"
              className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              Picker
            </Link>
          </li>
        </ul>

        {/* Right Section - Theme Toggle & User Menu/CTA */}
        <div className="relative flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {isLoading ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : user ? (
            <>
              {isLanding && (
                <Button asChild size="sm" className="hidden sm:flex">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )}
              <UserMenu user={user} />
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/login">Get Started</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
