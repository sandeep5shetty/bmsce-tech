"use client";

import Image from "next/image";
import Link from "next/link";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { cn } from "@/lib/utils";

import { User as UserType } from "@/types";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLanding: boolean;
  user: UserType | null | undefined;
  pathname: string;
}

const appLinks = [
  { href: "/quiz", label: "Quiz" },
  { href: "/random-picker", label: "Picker" },
] as const;

const landingLinks = [
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
] as const;

export function MobileNav({
  open,
  onOpenChange,
  isLanding,
  user,
  pathname,
}: MobileNavProps) {
  const close = () => onOpenChange(false);

  const linkClass = (href: string) =>
    cn(
      "hover:text-foreground hover:bg-muted/50 block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      pathname === href || (href !== "/" && pathname.startsWith(href))
        ? "text-foreground bg-muted/50"
        : "text-muted-foreground",
    );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[min(100%,20rem)] flex-col">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 font-serif text-xl font-semibold">
            <Image src="/bmsce.svg" alt="" width={28} height={28} />
            <span>
              <span className="tracking-widest">BMSCE</span>.tech
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation menu
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-1 flex-col gap-1 px-1">
          {isLanding && (
            <>
              {landingLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={linkClass(link.href)}
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  toast.message("Don't worry, it's completely free 😌");
                  close();
                }}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors"
              >
                Pricing
              </button>
              <Separator className="my-2" />
            </>
          )}

          {appLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className={linkClass(link.href)}
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <>
              <Separator className="my-2" />
              <Link
                href="/dashboard"
                onClick={close}
                className={linkClass("/dashboard")}
              >
                Dashboard
              </Link>
            </>
          )}
        </nav>

        <SheetFooter className="gap-2 sm:flex-col">
          {!user && (
            <Button asChild className="w-full">
              <Link href="/auth/login" onClick={close}>
                Get Started
              </Link>
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
