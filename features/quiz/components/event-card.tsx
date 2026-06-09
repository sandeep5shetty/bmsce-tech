"use client";

import { useState } from "react";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

import {
  buildThemeStyle,
  resolveGradient,
  type CustomTheme,
} from "@/features/quiz/lib/themes";

type Event = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "published";
  created_at: string;
  theme_id: string | null;
  custom_theme: CustomTheme | null;
};

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const formattedDate = new Date(event.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const themeInput = {
    themeId: event.theme_id,
    customTheme: event.custom_theme,
  };
  const themeStyle = buildThemeStyle(themeInput);
  const gradient = resolveGradient(themeInput);

  async function handleDelete() {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;

    setDeleting(true);

    try {
      const res = await fetch(`/api/quiz/v1/events/${event.id}`, {
        method: "DELETE",
      });

      if (res.status === 204) {
        toast.success(`"${event.title}" deleted`);
        router.refresh();
        return;
      }

      const body = await res.json();

      if (body?.error?.code === "SESSION_ACTIVE") {
        toast.error("Cannot delete event", {
          description:
            "An active session is running for this event. End it first.",
        });
      } else {
        toast.error(body?.error?.message ?? "Failed to delete event.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card
      style={themeStyle}
      className="group flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
    >
      <div
        className="relative flex h-24 items-start justify-between px-4 py-3"
        style={{ background: gradient }}
      >
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/15 to-transparent" />
        <h3 className="relative line-clamp-2 pr-2 text-base font-bold leading-snug text-white drop-shadow-sm">
          {event.title}
        </h3>
        <StatusBadge status={event.status} />
      </div>

      <CardContent className="flex-1 pt-4 pb-3">
        {event.description ? (
          <p className="text-foreground/80 mb-2 line-clamp-2 text-sm">
            {event.description}
          </p>
        ) : null}
        <p className="text-muted-foreground text-xs">Created {formattedDate}</p>
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        <Button asChild className="flex-1">
          <Link href={`/quiz/events/${event.id}`}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          aria-label={`Delete event: ${event.title}`}
        >
          {deleting ? (
            <>
              <Spinner size="sm" />
              Deleting…
            </>
          ) : (
            <>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Delete</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function StatusBadge({ status }: { status: "draft" | "published" }) {
  if (status === "published") {
    return (
      <Badge className="relative shrink-0 bg-white/95 text-[10px] font-semibold text-green-800 shadow-sm">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" aria-hidden="true" />
        Published
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="relative shrink-0 bg-white/95 text-[10px] font-semibold text-gray-700 shadow-sm">
      Draft
    </Badge>
  );
}
