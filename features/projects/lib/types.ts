import { Project as ProjectType, TechStack } from "@/types";

export type Project = ProjectType & {
  techStack: TechStack[];
};

export interface NewProject {
  name: string;
  description: string;
  body?: string;
  liveLink: string;
  codeLink?: string;
  techStack: { label: string; image?: string }[];
}

export interface ProjectMetadata {
  openGraph: {
    title: string | null;
    description: string | null;
    image: string | null;
  };
  twitter: {
    card: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
  };
  html: {
    title: string | null;
    description: string | null;
  };
}
