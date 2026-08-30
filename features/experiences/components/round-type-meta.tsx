import {
  Briefcase,
  Calculator,
  CircleDot,
  ClipboardList,
  Code2,
  MessageSquare,
  Monitor,
  Network,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import { RoundType } from "../lib/validation";

/** Lucide icon per round stage — matches the document badge pattern elsewhere. */
export const roundTypeMeta: Record<RoundType, { icon: LucideIcon }> = {
  Aptitude: { icon: Calculator },
  OA: { icon: Monitor },
  Coding: { icon: Code2 },
  Technical: { icon: MessageSquare },
  "System Design": { icon: Network },
  GD: { icon: Users },
  Managerial: { icon: Briefcase },
  HR: { icon: UserRound },
  Assignment: { icon: ClipboardList },
  Other: { icon: CircleDot },
};
