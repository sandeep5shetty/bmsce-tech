"use client";

import { Label } from "@/components/ui/label";

interface QuizEventBehaviorSettingsProps {
  autoPlayMode: boolean;
  onAutoPlayModeChange: (value: boolean) => void;
  enforceFocusMode: boolean;
  onEnforceFocusModeChange: (value: boolean) => void;
}

function SettingToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-4">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="border-input text-primary focus:ring-ring mt-1 h-4 w-4 rounded"
      />
      <div className="space-y-1">
        <Label htmlFor={id} className="cursor-pointer font-medium">
          {label}
        </Label>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

export function QuizEventBehaviorSettings({
  autoPlayMode,
  onAutoPlayModeChange,
  enforceFocusMode,
  onEnforceFocusModeChange,
}: QuizEventBehaviorSettingsProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Quiz behavior</h3>
        <p className="text-muted-foreground text-sm">
          These settings apply to every live session for this event.
        </p>
      </div>

      <SettingToggle
        id="auto-play-mode"
        label="Auto play mode"
        description="When every participant has answered, automatically reveal results, show the leaderboard, and advance to the next question with short pauses between each step."
        checked={autoPlayMode}
        onCheckedChange={onAutoPlayModeChange}
      />

      <SettingToggle
        id="enforce-focus-mode"
        label="Require fullscreen & block tab switching"
        description="Participants must stay in fullscreen during the quiz. Leaving the tab triggers a warning; a second switch removes them from the session."
        checked={enforceFocusMode}
        onCheckedChange={onEnforceFocusModeChange}
      />
    </div>
  );
}
