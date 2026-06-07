import { notFound, redirect } from "next/navigation";

import { getUser } from "@/actions/user";
import { DriveResponseForm } from "@/features/placement/components/drive-response-form";
import {
  checkEligibility,
  getDrive,
  tryAutoSeedProfile,
} from "@/features/placement/lib/actions";

export default async function DrivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const currentUser = await getUser();
  if (!currentUser) redirect("/auth/login");

  // Silently create placement profile if not yet seeded
  await tryAutoSeedProfile();

  const [drive, eligibility] = await Promise.all([
    getDrive(id),
    checkEligibility(id, currentUser.id),
  ]);

  if (!drive) notFound();

  return (
    <DriveResponseForm
      drive={drive}
      currentUser={{
        id: currentUser.id,
        name: currentUser.name ?? currentUser.email,
        email: currentUser.email,
      }}
      initialEligibility={eligibility}
    />
  );
}
