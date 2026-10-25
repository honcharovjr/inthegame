import AuthShell from "@/components/AuthShell/AuthShell";
import AuthForm from "@/components/AuthForm/AuthForm";
import { requestPasswordReset } from "@/lib/auth/actions";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell headline="Reset your password." tone="yellow">
      <AuthForm
        action={requestPasswordReset}
        submitLabel="Send reset link"
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            placeholder: "you@example.com",
          },
        ]}
        links={[{ href: "/login", label: "Back to log in" }]}
      />
    </AuthShell>
  );
}
