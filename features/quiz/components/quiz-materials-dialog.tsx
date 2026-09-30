"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  QuizMaterialsPanel,
  type QuizMaterialSummary,
} from "@/features/quiz/components/quiz-materials-panel";

interface QuizMaterialsDialogProps {
  eventId: string;
}

export function QuizMaterialsDialog({ eventId }: QuizMaterialsDialogProps) {
  const [open, setOpen] = useState(false);
  const [readyCount, setReadyCount] = useState(0);

  function handleMaterialsChange(materials: QuizMaterialSummary[]) {
    setReadyCount(materials.filter((m) => m.status === "ready").length);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className=" shrink-0 site-theme bg-white/95 text-foreground dark:text-background hover:bg-white"
        >
          <FileText className="h-3.5 w-3.5" />
          Materials
          {readyCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1.5 border-0 bg-white/20 px-1.5 font-normal text-white"
            >
              {readyCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Course materials</DialogTitle>
        <QuizMaterialsPanel
          eventId={eventId}
          inDialog
          onMaterialsChange={handleMaterialsChange}
        />
      </DialogContent>
    </Dialog>
  );
}
