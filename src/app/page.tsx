import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingPageContent from "./landing-page-content";

export default async function HomePage() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return <LandingPageContent />;
}
