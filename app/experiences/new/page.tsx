import { ExperienceForm } from "@/features/experiences/components/experience-form";
import { ExperiencesBackLink } from "@/features/experiences/components/experiences-back-link";

export default function NewExperiencePage() {
  return (
    <div className="container mx-auto mt-8 mb-32 max-w-6xl space-y-6 px-6">
      <ExperiencesBackLink />
      <ExperienceForm />
    </div>
  );
}
