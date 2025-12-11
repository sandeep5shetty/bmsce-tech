// components/LoginButton.jsx
"use client";
import { signIn } from "next-auth/react";

export default function LoginButton() {
  return (
    <button
      onClick={() =>
        signIn("google", {
          // redirect to dashboard after successful login
          callbackUrl: "/dashboard",
        })
      }
      className="px-4 py-2 bg-black text-white rounded"
    >
      Login with BMSCE Email
    </button>
  );
}
