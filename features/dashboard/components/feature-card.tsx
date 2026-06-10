"use client";

import Link from "next/link";

import { ArrowRight, type LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export function FeatureCard({
  title,
  description,
  href,
  icon: Icon,
}: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group bg-card hover:shadow-primary/5 relative flex cursor-pointer flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:border-primary/30"
    >
      <div className="from-primary/5 absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex h-full flex-col gap-4 p-6">
        <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg leading-tight font-semibold tracking-tight">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>

        <div className="text-primary mt-auto flex items-center gap-1.5 text-sm font-medium opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          Open
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
