import posthog from "posthog-js";

// Product analytics (FR-34, PostHog). Off until NEXT_PUBLIC_POSTHOG_KEY is
// set. Cookieless: nothing is stored in the browser and visitors are not
// identified, so no cookie banner is needed. Data stays in PostHog's EU region.
// Counts page views and a few key moments (see src/lib/analytics.js); no
// clicks, no session recordings, no surveys.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  posthog.init(key, {
    api_host: "https://eu.i.posthog.com",
    defaults: "2026-08-30",
    cookieless_mode: "always",
    person_profiles: "never",
    capture_pageview: "history_change",
    capture_pageleave: false,
    autocapture: false,
    disable_session_recording: true,
    disable_surveys: true,
  });
}
