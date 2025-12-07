import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Github } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      <nav className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="BMSCE.tech" width={100} height={100} />
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground text-center sm:text-right">
              Made by{" "}
              <a
                href="https://sandeepshetty.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Sandy
              </a>
            </div>
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card>
          <CardContent className="pt-8 pb-8 space-y-6">
            <h1 className="text-3xl font-bold">About This Project</h1>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">What is BMSCE.tech?</h2>
              <p className="text-muted-foreground leading-relaxed">
                BMSCE.tech is a simple, efficient platform designed for class
                representatives (CRs) and lecturers to create quick questions
                and collect responses from students in real-time. It streamlines
                classroom communication and feedback collection.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">How It Works</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  CRs or lecturers create Yes/No or Short Answer questions
                </li>
                <li>A unique link is generated for each question</li>
                <li>
                  Students access the link, select their name from the database,
                  and submit their response
                </li>
                <li>All responses are tracked in real-time on the dashboard</li>
                <li>
                  Responses can be exported as CSV files for further analysis
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Data & Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                This application stores student names and roll numbers in a
                PostgreSQL database. Responses are associated with student IDs
                for tracking purposes. We do not collect any sensitive personal
                information beyond what is necessary for the app&apos;s
                functionality.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The app supports anonymous responses if the question creator
                enables that option. All data is stored securely and is only
                accessible to authorized users (CRs and lecturers).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Technology Stack</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Next.js 15 (App Router) with TypeScript</li>
                <li>PostgreSQL database with Prisma ORM</li>
                <li>shadcn/ui components for modern UI</li>
                <li>TailwindCSS for styling</li>
                <li>Deployed on Vercel</li>
              </ul>
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
