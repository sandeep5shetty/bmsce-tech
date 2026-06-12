"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import confetti from "canvas-confetti";
import { AnimatePresence, motion, useAnimate } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Reset from "@/components/icons/reset";
import Shuffle from "@/components/icons/shuffle";

import { ProjectCardPreview } from "@/features/lists/components";

import { cn } from "@/lib/utils";

import { Loader, Save, Tick } from "@/components/icons";

import Cursor from "../icons/cursor";

export default function FeaturesSection() {
  const features = [
    {
      title: "Create Polls",
      description:
        "Spin up yes/no or multiple-choice polls in seconds and share them with your class.",
      skeleton: <SkeletonCreatePoll />,
      className: "col-span-1 lg:col-span-4 border-b lg:border-r",
    },
    {
      title: "Join Live Quizzes",
      description:
        "Enter a join code, pick your avatar, and compete in real-time quiz sessions.",
      skeleton: <SkeletonJoinQuiz />,
      className: "border-b col-span-1 lg:col-span-2",
    },

    {
      title: "Save Posts",
      description:
        "Bookmark posts to revisit and explore later for inspiration and learning.",
      skeleton: <SkeletonSaveProject />,
      className: "col-span-1 lg:col-span-3 lg:border-r",
    },
    {
      title: "Random Student Picker",
      description:
        "Easily pick a random student from your class for presentations or activities.",
      skeleton: <SkeletonReviews />,
      className: "col-span-1 lg:col-span-3 border-b lg:border-none",
    },
  ];

  return (
    <section
      className="relative z-20 mx-auto max-w-5xl scroll-mt-24 px-4"
      id="features"
    >
      {/* Features Heading */}
      <div className="mb-8 space-y-3">
        <h2 className="text-foreground font-serif text-2xl font-semibold tracking-wider sm:text-3xl md:text-4xl">
          Why <span className="tracking-wider">BMSCE</span>.tech?
        </h2>
        <p className="text-muted-foreground max-w-md text-sm md:text-base">
          To build an open source community of students at BMSCE, fostering
          collaboration, learning, and innovation through shared projects and
          knowledge.
        </p>
      </div>

      <div className="border-border grid grid-cols-1 rounded-xl border lg:grid-cols-6">
        {features.map((feature) => (
          <FeatureCard key={feature.title} className={feature.className}>
            <FeatureTitle>{feature.title}</FeatureTitle>
            <FeatureDescription>{feature.description}</FeatureDescription>
            <div className="h-full w-full">{feature.skeleton}</div>
          </FeatureCard>
        ))}
      </div>
    </section>
  );
}

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn(`relative overflow-hidden p-4 sm:p-8`, className)}>
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="text-foreground mx-auto max-w-5xl text-left font-serif text-xl font-semibold tracking-wider md:text-2xl md:leading-snug">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="text-muted-foreground mx-0 my-2 max-w-sm text-left text-sm">
      {children}
    </p>
  );
};

// Skeleton 1: Create Poll Form
const SkeletonCreatePoll = () => {
  return (
    <div className="relative flex h-full justify-center px-8 py-8 perspective-distant transform-3d">
      <Card className="w-full max-w-md rotate-x-20 rotate-y-20 -rotate-z-15">
        <CardHeader>
          <CardTitle className="font-serif text-xl tracking-wider">
            Create Question
          </CardTitle>
          <CardDescription>
            Create a poll and share the link with your students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2 duration-300">
              <Label htmlFor="poll-question">Question</Label>
              <Input
                id="poll-question"
                value="Which topic should we cover next?"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <div className="bg-muted/50 text-foreground flex h-9 items-center rounded-md border px-3 text-sm">
                Yes / No
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poll-audience">Audience</Label>
              <div className="bg-muted/50 text-foreground flex h-9 items-center rounded-md border px-3 text-sm">
                All students
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border bg-primary/5 px-3 py-2.5">
              <div className="bg-primary/15 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                ✓
              </div>
              <span className="text-muted-foreground text-xs">
                Anonymous responses enabled
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button className="flex-1">Create Question</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="from-background via-background pointer-events-none absolute inset-x-0 bottom-0 z-40 h-20 w-full bg-gradient-to-t to-transparent sm:h-32" />
      <div className="from-background via-background pointer-events-none absolute right-0 z-40 h-full w-16 bg-gradient-to-l to-transparent sm:w-30" />
    </div>
  );
};

// Skeleton 2: Join Quiz — live session cards with answer selection animation
const SkeletonJoinQuiz = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [scope, animate] = useAnimate();

  const answerOptions = [
    { id: "a", label: "Data Structures" },
    { id: "b", label: "OS" },
    { id: "c", label: "DBMS" },
    { id: "d", label: "Networks" },
  ];

  useEffect(() => {
    const easeOut = [0.0, 0.0, 0.2, 1] as const;
    const easeInOut = [0.4, 0, 0.2, 1] as const;
    let isCancelled = false;

    function getCursorDelta() {
      const cursor = scope.current?.querySelector(
        "#quiz-cursor",
      ) as HTMLElement | null;
      const target = scope.current?.querySelector(
        "#opt-b",
      ) as HTMLElement | null;
      if (!cursor || !target) return { x: 0, y: 0 };

      const c = cursor.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const tip = { x: 6, y: 6 };

      return {
        x: t.left + t.width / 2 - tip.x - c.left,
        y: t.top + t.height / 2 - tip.y - c.top,
      };
    }

    async function runAnimation() {
      if (isCancelled || !scope.current) return;

      setSelectedOption(null);

      await animate(
        "#quiz-cursor",
        { opacity: 0, x: 0, y: 0, scale: 1 },
        { duration: 0 },
      );

      await animate(
        "#quiz-toast",
        { opacity: 0, translateY: 20, scale: 0.95 },
        { duration: 0 },
      );

      for (const id of ["opt-a", "opt-b", "opt-c", "opt-d"]) {
        await animate(
          `#${id}`,
          { backgroundColor: "transparent", scale: 1 },
          { duration: 0 },
        );
      }

      await new Promise((r) => setTimeout(r, 600));
      if (isCancelled) return;

      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      );
      const targetDelta = getCursorDelta();

      await animate(
        "#quiz-cursor",
        { opacity: 1 },
        { duration: 0.4, ease: easeOut },
      );

      await animate(
        "#quiz-cursor",
        { x: targetDelta.x, y: targetDelta.y },
        { duration: 0.75, ease: easeInOut },
      );

      await animate(
        "#opt-b",
        { backgroundColor: "rgba(59, 130, 246, 0.12)" },
        { duration: 0.15, ease: easeOut },
      );

      await new Promise((r) => setTimeout(r, 180));
      if (isCancelled) return;

      await animate(
        "#quiz-cursor",
        { scale: 0.85 },
        { duration: 0.06, ease: easeOut },
      );
      animate("#opt-b", { scale: 0.96 }, { duration: 0.06, ease: easeOut });
      await new Promise((r) => setTimeout(r, 60));

      animate("#quiz-cursor", { scale: 1 }, { duration: 0.1, ease: easeOut });
      await animate("#opt-b", { scale: 1 }, { duration: 0.1, ease: easeOut });

      setSelectedOption("b");
      await animate(
        "#opt-b",
        { backgroundColor: "rgba(34, 197, 94, 0.15)" },
        { duration: 0.2, ease: easeOut },
      );

      animate(
        "#quiz-cursor",
        {
          x: targetDelta.x + 10,
          y: targetDelta.y - 6,
          opacity: 0.4,
        },
        { duration: 0.35, ease: easeOut },
      );

      await new Promise((r) => setTimeout(r, 150));
      await animate(
        "#quiz-toast",
        { opacity: 1, translateY: 0, scale: 1 },
        { duration: 0.25, ease: easeOut },
      );

      await new Promise((r) => setTimeout(r, 2200));
      if (isCancelled) return;

      await animate(
        "#quiz-toast",
        { opacity: 0, translateY: 8, scale: 0.98 },
        { duration: 0.25, ease: easeInOut },
      );

      await animate(
        "#quiz-cursor",
        { x: 0, y: 10, opacity: 0, scale: 1 },
        { duration: 0.4, ease: easeInOut },
      );

      await new Promise((r) => setTimeout(r, 500));
      if (isCancelled) return;
      runAnimation();
    }

    const timeout = setTimeout(runAnimation, 500);
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [animate, scope]);

  return (
    <div
      className="relative flex h-full flex-col items-center justify-center py-6"
      ref={scope}
    >
      <div className="relative w-full max-w-xs space-y-3">
        <div className="bg-card rounded-xl border p-3 opacity-40">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wide text-primary uppercase">
              Join Code
            </span>
            <span className="text-muted-foreground font-mono text-[10px]">K7M2XP</span>
          </div>
          <p className="text-muted-foreground text-xs">Waiting for host to start…</p>
        </div>

        <div className="bg-card relative rounded-xl border p-4 shadow-lg">
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-wide text-primary uppercase">
                Question 3 of 10
              </span>
              <span className="text-muted-foreground text-[10px]">18s</span>
            </div>
            <p className="text-sm leading-snug font-semibold">
              Which subject are you most confident in?
            </p>
          </div>

          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="bg-primary h-full w-[62%] rounded-full" />
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-2">
              {answerOptions.map((opt) => (
                <div
                  key={opt.id}
                  id={`opt-${opt.id}`}
                  className={`rounded-lg border px-2.5 py-2 text-center text-[11px] font-medium transition-colors ${
                    selectedOption === opt.id
                      ? "border-green-500/40 text-green-700 dark:text-green-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </div>
              ))}
            </div>

            <Cursor
              id="quiz-cursor"
              className="pointer-events-none absolute left-0 top-full mt-0.5 size-5 opacity-0 z-10"
            />
          </div>
        </div>

        <div className="bg-card rounded-xl border p-3 opacity-40">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">
              🦊
            </span>
            <div>
              <p className="text-xs font-semibold">Leaderboard</p>
              <p className="text-muted-foreground text-[10px]">You&apos;re #4 · 1,240 pts</p>
            </div>
          </div>
        </div>

        <div
          id="quiz-toast"
          className="bg-card absolute right-0 bottom-4 left-0 mx-auto flex w-fit items-center gap-2 rounded-lg border px-3 py-2 opacity-0 shadow-xl"
          style={{ transform: "translateY(20px) scale(0.95)" }}
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15">
            <Tick className="h-3 w-3 text-green-500" />
          </div>
          <span className="text-xs font-medium whitespace-nowrap">
            Answer submitted!
          </span>
        </div>
      </div>
      <div className="from-background via-background/80 pointer-events-none absolute inset-x-0 top-0 z-40 h-10 w-full bg-gradient-to-b to-transparent sm:h-16" />
      <div className="from-background via-background/80 pointer-events-none absolute inset-x-0 bottom-0 z-40 h-10 w-full bg-gradient-to-t to-transparent sm:h-16" />
    </div>
  );
};

// Skeleton 3: Save Project - matches project-card structure
const SkeletonSaveProject = () => {
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [scope, animate] = useAnimate();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const techStack = [
    {
      id: "a2d56511-3b3f-4deb-9d30-9044c7ed1e57",
      label: "Nextjs",
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
    },
    {
      id: "373a9190-11bb-4d91-9c0a-54b8302b2dc8",
      label: "React",
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    },
    {
      id: "d39832cb-008f-407a-b1d1-c0adb0307ec6",
      label: "Framermotion",
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/framermotion/framermotion-original.svg",
    },
    {
      id: "f5ee96e1-0f51-4c4d-90d6-173c748efdab",
      label: "Tailwindcss",
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg",
    },
    {
      id: "e0cf9e31-53a8-44b1-b909-d248f3dd3e25",
      label: "Supabase",
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg",
    },
    {
      id: "9367672d-b82d-44f8-858b-da5648bb508f",
      label: "Postgresql",
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
    },
  ];

  useEffect(() => {
    const easeOut = [0.0, 0.0, 0.2, 1] as const;
    const easeInOut = [0.4, 0, 0.2, 1] as const;
    let isCancelled = false;

    async function runAnimation() {
      if (isCancelled || !scope.current) return;

      // Reset states
      setSaved(false);
      setIsPending(false);

      // Reset cursor to start position (bottom-left, invisible)
      await animate(
        "#cursor",
        { opacity: 0, translateX: 0, translateY: 40, scale: 1 },
        { duration: 0 },
      );

      if (isCancelled) return;

      // Small delay before starting
      await new Promise((r) => setTimeout(r, 300));

      if (isCancelled) return;

      // 1. Cursor fades in smoothly
      await animate(
        "#cursor",
        { opacity: 1 },
        { duration: 0.4, ease: easeOut },
      );

      if (isCancelled) return;

      // 2. Cursor moves to button with natural curve
      await animate(
        "#cursor",
        { translateX: 12, translateY: -8 },
        { duration: 0.9, ease: easeInOut },
      );

      if (isCancelled) return;

      // 3. Hover effect on button
      await animate(
        "#button",
        { backgroundColor: "var(--color-primary-10, rgba(59, 130, 246, 0.1))" },
        { duration: 0.2, ease: easeOut },
      );

      if (isCancelled) return;

      // Natural pause before click
      await new Promise((r) => setTimeout(r, 250));

      if (isCancelled) return;

      // 4. Click - cursor presses down
      await animate(
        "#cursor",
        { scale: 0.85 },
        { duration: 0.08, ease: easeOut },
      );

      if (isCancelled) return;

      // Button reacts
      animate("#button", { scale: 0.94 }, { duration: 0.08, ease: easeOut });
      await new Promise((r) => setTimeout(r, 80));

      if (isCancelled) return;

      // 5. Release click
      animate("#cursor", { scale: 1 }, { duration: 0.12, ease: easeOut });
      await animate("#button", { scale: 1 }, { duration: 0.12, ease: easeOut });

      if (isCancelled) return;

      // 6. Start loading state - just show subtle opacity change
      setIsPending(true);

      // Cursor drifts away naturally
      animate(
        "#cursor",
        { translateX: 25, translateY: 10, opacity: 0.5 },
        { duration: 0.5, ease: easeOut },
      );

      if (isCancelled) return;

      // 7. Wait for "loading" (shorter, no spinner)
      await new Promise((r) => setTimeout(r, 1200));

      if (isCancelled) return;

      // 8. Complete - show saved state
      setIsPending(false);
      setSaved(true);

      // 9. Fire confetti! Get button position for accurate origin
      if (buttonRef.current && !isCancelled) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
          particleCount: 15,
          spread: 25,
          origin: { x, y },
          colors: ["#3b82f6", "#22c55e", "#eab308", "#ec4899", "#8b5cf6"],
          startVelocity: 12,
          gravity: 0.5,
          scalar: 0.5,
          ticks: 60,
          drift: 0,
        });
      }

      // Hold the saved state
      await new Promise((r) => setTimeout(r, 2000));

      if (isCancelled) return;

      // 10. Cursor smoothly returns to start position
      await animate(
        "#cursor",
        { translateX: 0, translateY: 40, opacity: 0 },
        { duration: 0.6, ease: easeInOut },
      );

      if (isCancelled) return;

      // Reset button background
      animate("#button", { backgroundColor: "transparent" }, { duration: 0.3 });

      // Small pause before looping
      await new Promise((r) => setTimeout(r, 500));

      if (isCancelled) return;

      // Loop the animation
      runAnimation();
    }

    // Start animation after initial delay
    const timeout = setTimeout(runAnimation, 800);
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [animate]);

  return (
    <div className="relative flex h-full items-center justify-center py-8 transform-flat">
      <article className="group bg-card relative mb-8 flex max-w-sm translate-z-10 flex-col overflow-hidden rounded-xl border perspective-distant">
        {/* Project Preview */}
        <ProjectCardPreview liveLink={"https://bmsce.tech"} />

        <div className="relative flex flex-1 flex-col gap-3 p-4">
          {/* Header with Actions */}
          <div className="flex flex-1 items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="text-foreground line-clamp-1 text-base leading-tight font-semibold tracking-normal">
                Phase Shift -2026
              </h3>
              <p className="text-muted-foreground line-clamp-2 flex-1 text-sm leading-snug">
                Organized by Department of Computer Applications, BMSCE.
              </p>
            </div>

            {/* Save Button */}
            <div className="relative" ref={scope}>
              <Button
                ref={buttonRef}
                variant="ghost"
                size="icon-sm"
                id="button"
                className={`h-8 w-8 cursor-default transition-colors ${
                  saved
                    ? "text-primary hover:text-primary hover:bg-primary/10"
                    : isPending
                      ? "text-muted-foreground"
                      : "text-muted-foreground hover:text-muted-foreground"
                }`}
              >
                {isPending ? (
                  <Loader className="h-3.5 w-3.5" />
                ) : (
                  <motion.div
                    animate={{ scale: saved ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Save
                      className={`h-3.5 w-3.5 ${saved && "fill-current"}`}
                    />
                  </motion.div>
                )}
              </Button>

              {/* Cursor */}
              <Cursor
                id="cursor"
                className="absolute bottom-0 left-0 size-5 opacity-0"
              />
            </div>
          </div>

          {/* Tech Stack */}
          <div className="flex items-center">
            {techStack.slice(0, 5).map((tech) => {
              const isHovered = hoveredTech === tech.id;
              return (
                <motion.div
                  key={tech.id}
                  className="bg-muted flex h-7 cursor-pointer items-center rounded-full border shadow-sm"
                  style={{
                    marginLeft: "-8px",
                    zIndex: isHovered ? 10 : 1,
                  }}
                  animate={{
                    width: isHovered ? "auto" : "28px",
                  }}
                  onMouseEnter={() => setHoveredTech(tech.id)}
                  onMouseLeave={() => setHoveredTech(null)}
                  layout
                  transition={{
                    duration: 0.25,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                    {tech.image ? (
                      <Image
                        src={tech.image}
                        alt={tech.label}
                        width={16}
                        height={16}
                        className="h-4 w-4 rounded-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold">
                        {tech.label.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <AnimatePresence>
                    {isHovered && (
                      <motion.span
                        className="overflow-hidden pr-2 text-xs font-medium"
                        initial={{
                          width: 0,
                          opacity: 0,
                          marginLeft: 0,
                        }}
                        animate={{
                          width: "auto",
                          opacity: 1,
                          marginLeft: "4px",
                        }}
                        exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                        transition={{
                          duration: 0.2,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        <span className="whitespace-nowrap">{tech.label}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
            {techStack.length > 5 && (
              <motion.div
                className="bg-muted text-muted-foreground hover:bg-accent flex h-7 cursor-pointer items-center rounded-full border text-[10px] font-medium shadow-sm"
                style={{
                  marginLeft: "-8px",
                  zIndex: hoveredTech === "more" ? 10 : 1,
                }}
                animate={{
                  width: hoveredTech === "more" ? "auto" : "28px",
                }}
                onMouseEnter={() => setHoveredTech("more")}
                onMouseLeave={() => setHoveredTech(null)}
                layout
                transition={{
                  duration: 0.25,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                  <span className="text-[10px] font-semibold">
                    +{techStack.length - 5}
                  </span>
                </div>

                <AnimatePresence>
                  {hoveredTech === "more" && (
                    <motion.span
                      className="overflow-hidden pr-2 text-xs font-medium"
                      initial={{
                        width: 0,
                        opacity: 0,
                        marginLeft: 0,
                      }}
                      animate={{
                        width: "auto",
                        opacity: 1,
                        marginLeft: "4px",
                      }}
                      exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                      transition={{
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                    >
                      <span className="whitespace-nowrap">more</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </article>
      <div className="from-background via-background pointer-events-none absolute inset-x-0 bottom-0 z-40 h-20 w-full bg-linear-to-t to-transparent sm:h-32" />
    </div>
  );
};

// Skeleton 4: Reviews & Ratings - Static mockup like Create List
const SkeletonReviews = () => {
  const ratingCategories = [
    { label: "Design and Aesthetics", value: 8 },
    { label: "User Experience", value: 7 },
    { label: "Creativity", value: 9 },
    { label: "Functionality", value: 8 },
    { label: "Hireability", value: 7 },
  ];

  const overallRating =
    ratingCategories.reduce((acc, cat) => acc + cat.value, 0) /
    ratingCategories.length;

  return (
    <div className="relative flex h-full justify-center px-2 py-8">
      <div className="max-h-[20rem] w-full">
        <Card className="w-full max-w-md gap-0">
          <CardHeader className="pb-4">
            <div className="space-y-2">
              <Label htmlFor="livelink">No. of Students</Label>
              <Input value={"3"} readOnly />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <Button className="flex-1">
                <Shuffle />
                Pick Random
              </Button>
              <Button variant="outline" className="flex-1">
                <Reset />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <span className="text-md">Picked Students</span>
            <div className="space-y-3">
              {/* Overall Rating Display */}
              <div className="bg-muted/30 flex items-center gap-2 rounded-xl border p-4">
                <div className="bg-primary flex size-10 items-center justify-center rounded-full font-mono text-white">
                  1
                </div>
                <div className="flex flex-col items-baseline">
                  <span className="text-foreground/70 text-md font-sans font-semibold">
                    Shrilaxmi Heralagi
                  </span>
                  <span className="text-muted-foreground font-sans text-xs">
                    1BM25MC088
                  </span>
                </div>
              </div>
              <div className="bg-muted/30 flex items-center gap-2 rounded-xl border p-4">
                <div className="bg-primary flex size-10 items-center justify-center rounded-full font-mono text-white">
                  2
                </div>
                <div className="flex flex-col items-baseline">
                  <span className="text-foreground/65 text-md font-sans font-semibold">
                    Padmaja N Bill
                  </span>
                  <span className="text-muted-foreground font-sans text-xs">
                    1BM25MC063
                  </span>
                </div>
              </div>
              <div className="bg-muted/30 flex items-center gap-2 rounded-xl border mask-b-to-80% p-4">
                <div className="bg-primary flex size-10 items-center justify-center rounded-full font-mono text-white">
                  3
                </div>
                <div className="flex flex-col items-baseline">
                  <span className="text-foreground/70 text-md font-sans font-semibold">
                    Sandeep Shetty
                  </span>
                  <span className="text-muted-foreground font-sans text-xs">
                    1BM25MC080
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="from-background via-background pointer-events-none absolute inset-x-0 bottom-0 z-40 h-40 w-full bg-gradient-to-t to-transparent sm:h-32" />
      {/* <div className="from-background via-background pointer-events-none absolute right-0 z-40 h-full w-20 bg-gradient-to-l to-transparent sm:w-30" /> */}
    </div>
  );
};
