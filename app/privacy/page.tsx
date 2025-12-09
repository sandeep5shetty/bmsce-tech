import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Github } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      <nav className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex max-sm:py-2 flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="BMSCE.tech" width={100} height={100} />
          </Link>
          <div className="flex items-center gap-4">
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
        </div>
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 max-sm:py-2">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card>
          <CardContent className="pt-8 max-sm:pt-2 pb-8 space-y-6">
            <h1 className="text-3xl font-bold">About This Project</h1>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">What is BMSCE.tech?</h2>
              <p className="text-muted-foreground leading-relaxed">
                BMSCE.tech is a simple, efficient platform where anyone can
                create quick questions and collect responses in real-time. It
                streamlines classroom communication and feedback collection for
                the BMSCE community.
              </p>
              <p className="text-muted-foreground leading-relaxed font-semibold">
                ⚠️ This website is created solely for educational purposes to
                demonstrate modern web development practices and to serve as a
                learning tool for students and developers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">How It Works</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Anyone can create Yes/No or Short Answer questions</li>
                <li>
                  Target specific audiences: &quotAll Students&quot or &quotMCA
                  1st yr Sec B&quot (for 58 pre-loaded students with USN and
                  section)
                </li>
                <li>
                  Enable optional anonymous responses for sensitive questions
                </li>
                <li>A unique, shareable link is generated for each question</li>
                <li>
                  For MCA Sec B questions: Students select their name from a
                  searchable database dropdown
                </li>
                <li>
                  For All Students questions: Manual name entry with optional
                  anonymous submission
                </li>
                <li>All responses are tracked in real-time on the dashboard</li>
                <li>
                  Export responses to CSV with full details (name, USN, answer,
                  timestamp)
                </li>
                <li>Open question links in new tabs for easy sharing</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Data & Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                This application stores student information in a PostgreSQL
                database hosted on Neon, including names, USNs (University
                Serial Numbers), and sections. Currently, the database contains
                58 MCA 1st year Section B students with complete records.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Response Submission Modes:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>
                  <strong>Identified:</strong> Students select their name from
                  the database, linking responses to their profile (name, USN,
                  section)
                </li>
                <li>
                  <strong>Anonymous:</strong> When enabled, students can submit
                  without revealing their identity
                </li>
                <li>
                  <strong>Manual Entry:</strong> For &quotAll Students&quot
                  audience, names can be entered manually
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                We collect only the information necessary for the app&apos;s
                functionality. No sensitive personal data, contact information,
                or authentication credentials are stored. All questions and
                responses are publicly accessible through the dashboard without
                authentication.
              </p>
              <p className="text-muted-foreground leading-relaxed font-semibold">
                ⚠️ As this is an educational project, please be aware that data
                privacy practices are implemented for demonstration purposes and
                may not meet all production-grade security standards. Do not
                submit sensitive or confidential information.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Technology Stack</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  Next.js 15 (App Router) with React 19, TypeScript 5, and React
                  Compiler
                </li>
                <li>
                  PostgreSQL database (Neon) with Prisma ORM 7.1.0 and pg
                  adapter
                </li>
                <li>
                  shadcn/ui components (New York style) with Radix UI primitives
                </li>
                <li>Tailwind CSS 4 with custom design tokens</li>
                <li>Lucide React icons and Sonner toast notifications</li>
                <li>Deployed on Vercel with automatic CI/CD</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Educational Purpose</h2>
              <p className="text-muted-foreground leading-relaxed">
                This project is developed primarily for educational purposes to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>
                  Demonstrate modern full-stack web development with Next.js,
                  React, and TypeScript
                </li>
                <li>
                  Showcase database design and ORM usage with Prisma and
                  PostgreSQL
                </li>
                <li>
                  Illustrate responsive UI/UX design with accessible components
                </li>
                <li>Provide practical examples of RESTful API development</li>
                <li>
                  Serve as a learning resource for students and developers
                </li>
                <li>
                  Facilitate classroom communication while teaching software
                  development
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                While the application is functional for real classroom use, its
                primary goal is education and skill development in modern web
                technologies.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Open Source</h2>
              <p className="text-muted-foreground leading-relaxed">
                This project is open source and available on GitHub.
                Contributions, bug reports, and feature requests are welcome!
                Feel free to fork the repository and submit pull requests.
              </p>
              <a
                href="https://github.com/sandeep5shetty/bmsce-tech"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
              >
                View on GitHub →
              </a>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions, feedback, or support, please reach out to the
                developer:
              </p>
              <a
                href="https://sandeepshetty.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
              >
                sandeepshetty.dev →
              </a>
            </section>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy & About
          </Link>
        </div>
      </footer>
    </div>
  );
}
