import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-3 text-center text-sm text-muted-foreground flex items-center justify-center gap-8">
        <div className="text-sm text-muted-foreground text-center sm:text-right">
          Made by{" "}
          <a
            href="https://sandeepshetty.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold transition-colors underline text-primary/75 hover:text-primary/45 "
          >
            Sandy
          </a>
        </div>
        <Link
          href="/privacy"
          className=" transition-colors font-semibold text-primary/75 hover:text-primary/45 cursor-pointer"
        >
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
