"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  QUIZ_ADMIN_TOOLBAR_SLOT_ID,
} from "@/features/quiz/components/quiz-admin-shell";

interface QuizAdminToolbarPortalProps {
  children: React.ReactNode;
}

export function QuizAdminToolbarPortal({ children }: QuizAdminToolbarPortalProps) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById(QUIZ_ADMIN_TOOLBAR_SLOT_ID));
  }, []);

  if (!slot) return null;

  return createPortal(children, slot);
}
