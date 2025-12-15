"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { ProfileDialog } from "@/features/profile/components/profile-dialog";

import { cn } from "@/lib/utils";

import { logout } from "@/actions/auth";

import { ArrowRight, Logout, NoImage } from "@/components/icons";
import { User } from "@/types";

import { Dashboard, List, SidebarOpen } from "../icons";

interface MobileNavProps {
  user: User | null;
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname.startsWith("/dashboard");
    }
    return pathname === path;
  };

  return (
    <>
      {user && (
        <ProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          user={user}
        />
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <SidebarOpen className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex w-[300px] flex-col px-0 sm:w-[340px]"
        >
          {/* Header with Logo */}
          <SheetHeader className="px-6 pb-4">
            <SheetTitle>
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <Image src="/bmsce.svg" alt="Logo" width={36} height={36} />
                <span className="font-serif text-2xl font-semibold">
                  BMSCE.tech
                </span>
              </Link>
            </SheetTitle>
          </SheetHeader>

          {/* User Profile Section */}
          {user && (
            <>
              <button
                onClick={() => {
                  setOpen(false);
                  setProfileOpen(true);
                }}
                className="bg-accent hover:bg-accent/80 w-full px-6 py-4 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="border-background h-12 w-12 border-2">
                    <AvatarImage
                      src={user.image || ""}
                      alt={user.name || "Profile Pic"}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {user.name ? getInitials(user.name) : <NoImage />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {user.name}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </p>
                  </div>
                  <ArrowRight className="text-muted-foreground h-4 w-4" />
                </div>
              </button>
              <Separator />
            </>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive("/dashboard")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <Dashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/lists"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive("/lists")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <List className="h-5 w-5" />
                <span>Lists</span>
              </Link>
            </div>

            {user && (
              <>
                <Separator className="my-4" />
                <div className="px-3">
                  <form action={logout}>
                    <button
                      type="submit"
                      className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                    >
                      <Logout className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </form>
                </div>
              </>
            )}

            {!user && (
              <>
                <Separator className="my-4" />
                <div className="px-6">
                  <Button asChild className="w-full" size="lg">
                    <Link href="/auth/login" onClick={() => setOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                  <p className="text-muted-foreground mt-3 text-center text-xs">
                    Already have an account?{" "}
                    <Link
                      href="/auth/login"
                      onClick={() => setOpen(false)}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
