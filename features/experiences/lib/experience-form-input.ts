import { toRoundOutcome } from "../components/round-outcome";
import { UploadedDocument } from "../components/document-upload";
import { ExperienceWithAuthor } from "./types";
import {
  DocumentType,
  ExperienceRoundInput,
  RoundType,
  resultOptions,
} from "./validation";

export type ExperienceFormInitialData = {
  companyName: string;
  companyLogoUrl: string | null;
  role: string;
  batch: string;
  result: (typeof resultOptions)[number];
  ctcLpa: string;
  overview: string;
  preparationResources: string;
  jd: UploadedDocument | null;
  rounds: ExperienceRoundInput[];
  resources: { title: string; document: UploadedDocument }[];
};

function documentTypeFromFileName(fileName: string | null): DocumentType {
  return fileName?.toLowerCase().endsWith(".docx") ? "docx" : "pdf";
}

/** Maps a stored experience into the shape the shared form expects. */
export function experienceToFormInput(
  experience: ExperienceWithAuthor,
): ExperienceFormInitialData {
  return {
    companyName: experience.companyName,
    companyLogoUrl: experience.companyLogoUrl,
    role: experience.role,
    batch: experience.batch,
    result: experience.result as ExperienceFormInitialData["result"],
    ctcLpa: experience.ctcLpa != null ? String(experience.ctcLpa) : "",
    overview: experience.overview,
    preparationResources: experience.preparationResources ?? "",
    jd: experience.jdUrl
      ? {
          url: experience.jdUrl,
          type: documentTypeFromFileName(experience.jdFileName),
          fileName: experience.jdFileName ?? "Job description",
          fileSize: 0,
        }
      : null,
    rounds: experience.rounds.map((round) => ({
      roundNumber: round.roundNumber,
      roundType: round.roundType as RoundType,
      description: round.description,
      difficulty:
        round.difficulty === "Easy" ||
        round.difficulty === "Medium" ||
        round.difficulty === "Hard"
          ? round.difficulty
          : undefined,
      outcome: toRoundOutcome(round.outcome) ?? undefined,
    })),
    resources: experience.resources.map((resource) => ({
      title: resource.title,
      document: {
        url: resource.content,
        type: (resource.type === "docx" ? "docx" : "pdf") as DocumentType,
        fileName: resource.fileName ?? resource.title,
        fileSize: resource.fileSize ?? 0,
      },
    })),
  };
}
