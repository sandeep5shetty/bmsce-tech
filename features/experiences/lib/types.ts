import {
  InterviewExperience,
  InterviewExperienceComment,
  InterviewExperienceResource,
  InterviewExperienceRound,
  User,
} from "@/types";

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
  resourceCount: number;
  commentCount: number;
};
