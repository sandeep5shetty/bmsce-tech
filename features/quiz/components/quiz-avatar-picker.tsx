"use client";

import { QuizAvatar } from "@/features/quiz/components/quiz-avatar";
import {
  QUIZ_OTHER_AVATAR_OPTIONS,
  QUIZ_PERSON_AVATAR_OPTIONS,
} from "@/features/quiz/lib/quiz-avatars";

interface QuizAvatarPickerProps {
  selectedAvatar: string | null;
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}

function AvatarGrid({
  emojis,
  selectedAvatar,
  onSelect,
  disabled,
}: {
  emojis: readonly string[];
  selectedAvatar: string | null;
  onSelect: (emoji: string) => void;
  disabled: boolean;
}) {
  return (
    <div
      className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 sm:gap-2"
      role="radiogroup"
      aria-label="Avatar selection"
    >
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="radio"
          aria-checked={selectedAvatar === emoji}
          onClick={() => onSelect(emoji)}
          className={`
            flex aspect-square w-full items-center justify-center rounded-lg
            transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
            ${
              selectedAvatar === emoji
                ? "bg-primary/20 ring-2 ring-primary"
                : "bg-muted hover:bg-muted/80"
            }
          `}
          disabled={disabled}
          aria-label={`Avatar: ${emoji}`}
        >
          <QuizAvatar emoji={emoji} size="lg" />
        </button>
      ))}
    </div>
  );
}

export function QuizAvatarPicker({
  selectedAvatar,
  onSelect,
  disabled = false,
}: QuizAvatarPickerProps) {
  return (
    <div className="max-h-64 overflow-y-auto rounded-xl border bg-muted/20 p-2 sm:max-h-72">
      <p className="text-muted-foreground mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide">
        People
      </p>
      <AvatarGrid
        emojis={QUIZ_PERSON_AVATAR_OPTIONS}
        selectedAvatar={selectedAvatar}
        onSelect={onSelect}
        disabled={disabled}
      />
      <p className="text-muted-foreground mt-3 mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide">
        More
      </p>
      <AvatarGrid
        emojis={QUIZ_OTHER_AVATAR_OPTIONS}
        selectedAvatar={selectedAvatar}
        onSelect={onSelect}
        disabled={disabled}
      />
    </div>
  );
}
