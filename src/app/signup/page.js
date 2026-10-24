import AuthShell from "@/components/AuthShell/AuthShell";
import AuthForm from "@/components/AuthForm/AuthForm";
import { signUp } from "@/lib/auth/actions";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthShell headline="Every game you play, remembered.">
      <AuthForm
        action={signUp}
        submitLabel="Create account"
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
        links={[{ href: "/login", label: "I already have an account" }]}
      />
    </AuthShell>
  );
}
