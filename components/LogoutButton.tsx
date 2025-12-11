"use client";

/* import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  return (
    <Button
      variant="outline"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-4 py-2"
    >
      Logout
    </Button>
  );
} */
// components/LogoutButton.jsx
"use client";
import { signOut } from "next-auth/react";
// import { Button } from "@/components/ui/button"; // only if that component is client-ready

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-4 py-2 border rounded"
    >
      Logout
    </button>
  );
}
