import AuthShell from "@/components/AuthShell/AuthShell";
import AuthForm from "@/components/AuthForm/AuthForm";
import { updatePassword } from "@/lib/auth/actions";

export const metadata = { title: "choose a new password" };

export default function ResetPasswordPage() {
  return (
    <AuthShell headline="Choose a new password.">
      <AuthForm
        action={updatePassword}
        submitLabel="Save password"
        fields={[
          {
            name: "password",
            label: "New password",
            type: "password",
            autoComplete: "new-password",
            placeholder: "At least 8 characters",
          },
        ]}
      />
    </AuthShell>
  );
}
