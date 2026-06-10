"use client";

import { EmptyAddCard } from "@/components/common/empty-add-card";

interface CreateListCardProps {
  onClick: () => void;
}

export function CreateListCard({ onClick }: CreateListCardProps) {
  return (
    <EmptyAddCard
      title="Add List"
      description="Collect amazing work."
      onClick={onClick}
      className="h-full"
    />
  );
}
