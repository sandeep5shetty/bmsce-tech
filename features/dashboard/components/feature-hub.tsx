"use client";

import {
  Briefcase,
  ClipboardList,
  FileText,
  HelpCircle,
  MessagesSquare,
  Users,
} from "lucide-react";

import { FeatureCard } from "./feature-card";

const features = [
  {
    title: "Quiz",
    description:
      "Join live quiz sessions with a code, or manage events if you're a coordinator.",
    href: "/quiz/join",
    icon: HelpCircle,
  },
  {
    title: "Polls",
    description:
      "Create polls, share join links, and collect responses from your class.",
    href: "/questions",
    icon: ClipboardList,
  },
  {
    title: "SmartForm",
    description:
      "Fill out forms shared by coordinators and view all your past submissions.",
    href: "/smartform/submissions",
    icon: FileText,
  },
  {
    title: "Random Picker",
    description:
      "Pick a random student fairly from your roster during class or events.",
    href: "/random-picker",
    icon: Users,
  },
  {
    title: "Placements",
    description:
      "Browse placement drives, register, and track your eligibility status.",
    href: "/placement",
    icon: Briefcase,
  },
  {
    title: "Placement Experiences",
    description:
      "Round-by-round placement writeups from seniors — aptitude, OA, coding and interviews.",
    href: "/experiences",
    icon: MessagesSquare,
  },
] as const;

export function FeatureHub() {
  return (
    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
      {features.map((feature) => (
        <FeatureCard key={feature.href} {...feature} />
      ))}
    </div>
  );
}
