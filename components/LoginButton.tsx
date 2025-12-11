// components/LoginButton.jsx
"use client";
import { signIn } from "next-auth/react";
import { Button } from "./ui/button";

export default function LoginButton() {
  return (
    <Button
      onClick={() =>
        signIn("google", {
          // redirect to dashboard after successful login
          callbackUrl: "/",
        })
      }
      className="px-4 py-2 bg-black text-white rounded"
    >
      Login with BMSCE Email
    </Button>
  );
}
