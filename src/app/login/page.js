import { Suspense } from "react";
import AuthShell from "@/components/AuthShell/AuthShell";
import AuthForm from "@/components/AuthForm/AuthForm";
import { signIn } from "@/lib/auth/actions";

export const metadata = { title: "log in" };

export default function LoginPage({ searchParams }) {
  return (
    <AuthShell headline="Welcome back." tone="turquoise">
      <Suspense fallback={null}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

// Reads the URL query, so it streams in behind the Suspense boundary.
async function LoginForm({ searchParams }) {
  const { error, next } = await searchParams;
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "";

  return (
    <AuthForm
      action={signIn}
      submitLabel="Log in"
      hidden={safeNext ? { next: safeNext } : {}}
      initialError={error === "link" ? "That link is not valid anymore." : null}
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
          autoComplete: "current-password",
          placeholder: "Your password",
        },
      ]}
      links={[
        {
          href: safeNext
            ? `/signup?next=${encodeURIComponent(safeNext)}`
            : "/signup",
          label: "Create an account",
        },
        { href: "/forgot-password", label: "Forgot password", muted: true },
      ]}
    />
  );
}
