import { cn } from "@/lib/utils";

import { getAppleEmojiImageUrl } from "@/features/quiz/lib/quiz-avatars";

const sizeClasses = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
  "2xl": "h-12 w-12",
  "3xl": "h-16 w-16",
  hero: "h-20 w-20",
} as const;

type QuizAvatarSize = keyof typeof sizeClasses;

interface QuizAvatarProps {
  emoji: string;
  size?: QuizAvatarSize;
  className?: string;
}

export function QuizAvatar({ emoji, size = "md", className }: QuizAvatarProps) {
  if (!emoji) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external Apple-style emoji CDN
    <img
      src={getAppleEmojiImageUrl(emoji)}
      alt=""
      aria-hidden
      draggable={false}
      loading="lazy"
      className={cn("inline-block shrink-0 object-contain select-none", sizeClasses[size], className)}
    />
  );
}
