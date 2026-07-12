"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReopenGrantDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  remarks: string;
  grantedAt: string;
  grantedByName: string | null;
}

export function ReopenGrantDetailsDialog({
  open,
  onOpenChange,
  studentName,
  remarks,
  grantedAt,
  grantedByName,
}: ReopenGrantDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reopen details</DialogTitle>
          <DialogDescription>
            Why {studentName} was individually allowed to respond to this closed
            poll.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Remarks
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{remarks}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Reopened by
              </p>
              <p className="mt-1 text-sm">{grantedByName ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Reopened at
              </p>
              <p className="mt-1 text-sm">
                {new Date(grantedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
