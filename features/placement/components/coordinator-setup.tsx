"use client";

import { useState } from "react";

import { Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CoordinatorSetup() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/coordinator/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to set coordinator");
      } else {
        toast.success("Coordinator access granted! Reloading...");
        setOpen(false);
        window.location.reload();
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Shield className="mr-1.5 h-3.5 w-3.5" />
          Coordinator login
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Coordinator Access</DialogTitle>
          <DialogDescription>
            Enter the coordinator code to unlock management controls.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coord-code">Coordinator Code</Label>
            <Input
              id="coord-code"
              type="password"
              placeholder="Enter code..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
            {loading ? "Verifying..." : "Unlock Coordinator Mode"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
