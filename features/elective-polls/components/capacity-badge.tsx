import { Badge } from "@/components/ui/badge";

interface CapacityBadgeProps {
  seatsTaken: number;
  capacity: number;
  className?: string;
}

export function CapacityBadge({
  seatsTaken,
  capacity,
  className,
}: CapacityBadgeProps) {
  const isFull = seatsTaken >= capacity;
  return (
    <Badge variant={isFull ? "destructive" : "outline"} className={className}>
      {isFull ? "Full" : `${seatsTaken}/${capacity} seats`}
    </Badge>
  );
}

export function SeatBar({
  seatsTaken,
  capacity,
}: {
  seatsTaken: number;
  capacity: number;
}) {
  const pct = capacity > 0 ? Math.min((seatsTaken / capacity) * 100, 100) : 0;
  const isFull = seatsTaken >= capacity;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
      <div
        className={`h-1.5 rounded-full transition-all ${isFull ? "bg-red-500" : "bg-primary"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
