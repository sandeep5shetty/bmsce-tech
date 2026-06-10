import { redirect } from "next/navigation";

/** Legacy route — USN login removed; use standard BMSCE email login. */
export default function StudentLoginPage() {
  redirect("/auth/login");
}
