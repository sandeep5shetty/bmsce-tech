"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalWrapperProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function ModalWrapper({
  children,
  title,
  description,
}: ModalWrapperProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(false);
      // Wait for the exit animation to complete before navigating
      setTimeout(() => {
        router.back();
      }, 200); // Match this with dialog animation duration
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl leading-none tracking-wider">
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
