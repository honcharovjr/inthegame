import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";

async function Check() {
  await requireUser();
  return null;
}

// For pages without player data: the page itself is prerendered, and this
// check streams in behind it and sends a visitor who is not logged in to
// the login page.
export default function LoginGuard() {
  return (
    <Suspense fallback={null}>
      <Check />
    </Suspense>
  );
}
