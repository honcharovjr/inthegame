import { Suspense } from "react";
import AuthShell from "@/components/AuthShell/AuthShell";
import AuthForm from "@/components/AuthForm/AuthForm";
import { signUp } from "@/lib/auth/actions";

export const metadata = { title: "Create account" };

export default function SignUpPage({ searchParams }) {
  return (
    <AuthShell headline="Every game you play, remembered.">
      <Suspense fallback={null}>
        <SignUpForm searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

// Reads the URL query, so it streams in behind the Suspense boundary.
async function SignUpForm({ searchParams }) {
  const { next } = await searchParams;
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "";

  return (
    <AuthForm
      action={signUp}
      submitLabel="Create account"
      hidden={safeNext ? { next: safeNext } : {}}
      fields={[
        {
          name: "email",
          label: "Email",
          type: "email",
          autoComplete: "email",
          placeholder: "you@example.com",
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          autoComplete: "new-password",
          placeholder: "At least 8 characters",
        },
      ]}
      links={[
        {
          href: safeNext
            ? `/login?next=${encodeURIComponent(safeNext)}`
            : "/login",
          label: "I already have an account",
        },
      ]}
    />
  );
}
