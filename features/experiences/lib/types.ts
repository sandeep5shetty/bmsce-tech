import {
  InterviewExperience,
  InterviewExperienceComment,
  InterviewExperienceResource,
  InterviewExperienceRound,
  User,
} from "@/types";

import { RoundOutcome } from "./validation";

export type ExperienceWithAuthor = InterviewExperience & {
  author: Pick<User, "id" | "name" | "image">;
  rounds: InterviewExperienceRound[];
  resources: InterviewExperienceResource[];
};

export type CommentWithAuthor = InterviewExperienceComment & {
  author: Pick<User, "id" | "name" | "image">;
};

export type ExperienceListItem = InterviewExperience & {
  author: Pick<User, "id" | "name" | "image">;
  roundCount: number;
  clearedRoundCount: number;
  /** Round outcomes in round order — null where the author didn't record one. */
  roundOutcomes: (RoundOutcome | null)[];
  resourceCount: number;
  commentCount: number;
};
