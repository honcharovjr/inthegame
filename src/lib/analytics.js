import posthog from "posthog-js";

// The key moments the product is measured by (FR-34). Names are fixed, so
// charts in PostHog keep working: sign_up, session_logged, team_created,
// game_played, account_deleted. Call only from Client Components. Does
// nothing while analytics is off.
export function track(event, properties) {
  if (!posthog.__loaded) return;
  posthog.capture(event, properties);
}
