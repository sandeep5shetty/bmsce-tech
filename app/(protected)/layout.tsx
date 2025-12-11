"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // While loading session
  if (status === "loading") return null;

  // Not logged in → redirect to login (client-side)
  if (!session) {
    router.push("/login");
    return null;
  }

  return <>{children}</>;
}
