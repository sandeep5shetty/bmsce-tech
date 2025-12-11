"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import ProfileDropdown from "@/components/ProfileDropdown";
import { useSession } from "next-auth/react";
import LoginButton from "@/components/LoginButton";
import { AnimatedTooltipPreview } from "@/components/AnimatedTooltip";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      {/* NAVBAR */}
      <nav className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* LEFT SIDE — LOGO */}
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="BMSCE.tech" width={100} height={100} />
          </Link>

          {/* RIGHT SIDE — PROFILE DROPDOWN OR LOGIN */}
          {session?.user?.email ? (
            <ProfileDropdown email={session.user.email} />
          ) : (
            <LoginButton />
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 max-w-2xl leading-snug">
          Open Source Community <br /> for <br />
          BMSCE Students
        </h1>
        <p className="text-muted-foreground mb-8 max-w-xl">
          Still Building. Many features and collaborations coming soon.
        </p>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/create">
            <Button size="lg" className="text-base px-8">
              Create Question
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="text-base px-8">
              View Dashboard
            </Button>
          </Link>

          <Link href="/random-picker">
            <Button size="lg" variant="outline" className="text-base px-8">
              Random Picker
            </Button>
          </Link>
        </div>

        {/* FOOTNOTE */}
        <div className="text-sm text-muted-foreground mt-6">
          <p className="py-4 font-semibold text-primary/75 ">Contributors : </p>
          <AnimatedTooltipPreview />
          {/* Made by{" "}
          <a
            href="https://sandeepshetty.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline text-primary/75 hover:text-primary/45"
          >
            Sandy 
            </a>
            */}
        </div>
      </main>

      <Footer />
    </div>
  );
}
