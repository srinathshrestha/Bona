import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPageContent from "./landing-page-content";

export default async function HomePage() {
  const userId = await getCurrentUser();
  // Redirect authenticated users to dashboard
  if (userId) {
    redirect("/dashboard");
  }
  return <LandingPageContent />;
}
