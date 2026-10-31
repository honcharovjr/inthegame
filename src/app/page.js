import { getSiteSettings } from "@/lib/site/settings";
import Landing from "./Landing";

export const metadata = {
  title: "in the game: every win you ever had, in one place",
  description: "log board and card game nights in under a minute. your history grows into ratings, rivalries and achievements.",
};

// The landing page, at "/" for everyone. The app itself lives under /app.
export default async function LandingPage() {
  const settings = await getSiteSettings();
  return <Landing contactEmail={settings.contact_email} />;
}
