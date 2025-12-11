"use client";
/* import { signIn } from "next-auth/react";

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn("google")}
      className="px-4 py-2   bg-black text-white rounded"
    >
      Login with BMSCE Email
    </button>
  );
} */


// app/login/page.jsx (or pages/login.jsx depending on your setup)
import LoginButton from "@/components/LoginButton";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 rounded-md shadow-md">
        <h1 className="text-xl font-semibold mb-4"></h1>
        <LoginButton />
      </div>
    </div>
  );
}

