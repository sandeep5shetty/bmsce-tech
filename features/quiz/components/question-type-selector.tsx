"use client";

import type { QuestionType } from "@/features/quiz/components/question-card";

interface QuestionTypeSelectorProps {
  value: QuestionType;
  onChange: (type: QuestionType) => void;
}

const QUESTION_TYPES: {
  value: QuestionType;
  label: string;
  description: string;
}[] = [
  {
    value: "single_select",
    label: "Single Select",
    description: "Only one correct answer. Participants pick one.",
  },
  {
    value: "multi_select",
    label: "Multi Select",
    description: "One or more correct answers. Participants pick all that apply.",
  },
];

export function QuestionTypeSelector({
  value,
  onChange,
}: QuestionTypeSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">Question Type</legend>
      <div className="grid grid-cols-1 gap-2">
        {QUESTION_TYPES.map((type) => {
          const isSelected = value === type.value;
          return (
            <label
              key={type.value}
              className={`flex cursor-pointer flex-col rounded-lg border p-3 transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-input hover:border-primary/50 hover:bg-accent/50"
              }`}
            >
              <input
                type="radio"
                name="question_type"
                value={type.value}
                checked={isSelected}
                onChange={() => onChange(type.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{type.label}</span>
              <span className="text-muted-foreground mt-0.5 text-xs">
                {type.description}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
