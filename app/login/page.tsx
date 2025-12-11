"use client";
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
