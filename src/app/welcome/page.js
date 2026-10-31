import { getSiteSettings } from "@/lib/site/settings";
import Landing from "./Landing";

export const metadata = {
  title: "in the game: every win you ever had, in one place",
  description: "log board and card game nights in under a minute. your history grows into ratings, rivalries and achievements.",
};

// The landing page. Visitors who are not logged in see it at "/" (the proxy
// rewrites the address), so players keep Home at "/".
export default async function WelcomePage() {
  const settings = await getSiteSettings();
  return <Landing contactEmail={settings.contact_email} />;
}
