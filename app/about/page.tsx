import Link from "next/link";

import { ArrowLeft, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto mt-8 mb-32 max-w-4xl px-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-8 pt-8 pb-10">
          <div>
            <h1 className="font-serif text-3xl font-semibold">
              About BMSCE.tech
            </h1>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">What is BMSCE.tech?</h2>
            <p className="text-muted-foreground leading-relaxed">
              BMSCE.tech is an open-source platform built by and for BMSCE MCA
              students. It streamlines classroom communication, tracks project
              reviews, manages placement drives, and makes student coordination
              effortless.
            </p>
            <p className="text-muted-foreground leading-relaxed font-medium">
              ⚠️ This website is created solely for educational purposes to
              demonstrate modern web development practices and to serve as a
              learning tool for students and developers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Features</h2>
            <ul className="text-muted-foreground list-inside list-disc space-y-2">
              <li>
                <strong>Polls</strong> — Create Yes/No or Short Answer questions
                and track responses live. Supports targeted audiences (all
                students or MCA 1st yr Sec B) and optional anonymous mode.
              </li>
              <li>
                <strong>Live Wall</strong> — A real-time word-cloud view of poll
                responses that updates every few seconds — great for projecting
                during class.
              </li>
              <li>
                <strong>Random Picker</strong> — Cryptographically secure random
                student selector with drag-and-drop management. Persists picks
                across page refreshes.
              </li>
              <li>
                <strong>Placement Pulse</strong> — Track Superset registrations
                for company drives with eligibility gating by CGPA and backlog
                status. Coordinator dashboard with CSV export.
              </li>
              <li>
                <strong>Project Lists</strong> — Curated project review lists
                with ratings across design, UX, creativity, functionality, and
                hireability.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Data &amp; Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The application stores student information (names, USNs, sections)
              in a PostgreSQL database hosted on Neon. The database contains 58
              MCA 1st year Section B students.
            </p>
            <ul className="text-muted-foreground ml-4 list-inside list-disc space-y-1">
              <li>
                <strong>Identified:</strong> Users log in with their account and
                responses are linked to their email.
              </li>
              <li>
                <strong>Anonymous:</strong> When enabled, only the answer is
                stored — no identity.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed font-medium">
              ⚠️ As this is an educational project, data privacy is implemented
              for demonstration purposes. Do not submit sensitive or confidential
              information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Technology Stack</h2>
            <ul className="text-muted-foreground list-inside list-disc space-y-1">
              <li>Next.js 16 (App Router), React 19, TypeScript 5</li>
              <li>Drizzle ORM with PostgreSQL (Neon serverless)</li>
              <li>Better Auth for authentication (email/password + Google OAuth)</li>
              <li>shadcn/ui components (New York style) + Radix UI</li>
              <li>Tailwind CSS 4, Sonner toasts, TanStack Query &amp; Form</li>
              <li>@dnd-kit for drag-and-drop interactions</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Open Source</h2>
            <p className="text-muted-foreground leading-relaxed">
              This project is open source. Contributions, bug reports, and
              feature requests are welcome!
            </p>
            <Button variant="outline" asChild>
              <a
                href="https://github.com/sandeep5shetty/bmsce-tech"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
