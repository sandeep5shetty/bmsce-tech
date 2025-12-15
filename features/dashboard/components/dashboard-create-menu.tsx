"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { CreateListDialog } from "@/features/lists/components";

import { Plus } from "@/components/icons";

export function DashboardCreateMenu() {
  const [createListOpen, setCreateListOpen] = useState(false);

  const handleCreateList = () => {
    setCreateListOpen(true);
  };

  return (
    <>
      <CreateListDialog
        open={createListOpen}
        onOpenChange={setCreateListOpen}
      />

      <Button size="sm" onClick={handleCreateList}>
        <Plus />
        Create
      </Button>
    </>
  );
}
