import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Github } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      <nav className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-0  lg:gap-4">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="BMSCE.tech" width={100} height={100} />
          </Link>
          <a
            href="https://github.com/sandeep5shetty/bmsce-tech"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:block"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Github className="w-4 h-4" />
              View on GitHub
            </Button>
          </a>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="space-y-4 text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-normal sm:tracking-tight lg:leading-12 lg:text-4xl">
            An Open-Source Community <br />
            for <br />
            BMSCE Students
          </h1>
          <p className="text-sm text-neutral-600 max-sm:w-[88vw] sm:w-[500px] mx-auto">
            Still building. New features and collaborations ahead.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/create">
            <Button size="lg" className="text-base px-8 w-full sm:w-auto">
              Create Question
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 w-full sm:w-auto"
            >
              View Dashboard
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
