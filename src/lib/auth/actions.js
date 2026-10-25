"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MIN_PASSWORD_LENGTH = 8;

function readEmail(formData) {
  return String(formData.get("email") ?? "").trim();
}

function readPassword(formData) {
  return String(formData.get("password") ?? "");
}

async function readOrigin() {
  return (await headers()).get("origin");
}

export async function signUp(previousState, formData) {
  const email = readEmail(formData);
  const password = readPassword(formData);

  if (!email) {
    return { error: "Enter your email.", values: { email } };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      values: { email },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await readOrigin()}/auth/callback` },
  });

  if (error) {
    return { error: error.message, values: { email } };
  }
  if (!data.session) {
    return {
      notice: "Check your email to confirm your account.",
      values: { email },
    };
  }
  redirect("/");
}

export async function signIn(previousState, formData) {
  const email = readEmail(formData);
  const password = readPassword(formData);

  if (!email || !password) {
    return { error: "Enter your email and password.", values: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Wrong email or password.", values: { email } };
  }
  redirect("/");
}

export async function requestPasswordReset(previousState, formData) {
  const email = readEmail(formData);

  if (!email) {
    return { error: "Enter your email.", values: { email } };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await readOrigin()}/auth/callback?next=/reset-password`,
  });

  // Same answer whether or not the email has an account.
  return {
    notice: "If that email has an account, a reset link is on its way.",
    values: { email },
  };
}

export async function updatePassword(previousState, formData) {
  const password = readPassword(formData);

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
