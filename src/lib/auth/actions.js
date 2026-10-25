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

// Where to go after logging in. Only paths inside the app are allowed.
function readNext(formData) {
  const next = String(formData.get("next") ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

async function readOrigin() {
  return (await headers()).get("origin");
}

// A failed or finished form. fields names the inputs to mark; at lets the
// page show the same message again after a second try.
function result(message, values, fields = []) {
  return { ...message, values, fields, at: Date.now() };
}

export async function signUp(previousState, formData) {
  const email = readEmail(formData);
  const password = readPassword(formData);

  if (!email) {
    return result({ error: "Enter your email." }, { email }, ["email"]);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return result(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { email },
      ["password"],
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await readOrigin()}/auth/callback?next=${encodeURIComponent(readNext(formData))}`,
    },
  });

  if (error) {
    return result({ error: error.message }, { email }, ["email"]);
  }
  if (!data.session) {
    return result({ notice: "Check your email to confirm your account." }, { email });
  }
  redirect(readNext(formData));
}

export async function signIn(previousState, formData) {
  const email = readEmail(formData);
  const password = readPassword(formData);

  if (!email || !password) {
    return result({ error: "Enter your email and password." }, { email }, [
      !email && "email",
      !password && "password",
    ].filter(Boolean));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return result({ error: "Wrong email or password." }, { email }, [
      "email",
      "password",
    ]);
  }
  redirect(readNext(formData));
}

export async function requestPasswordReset(previousState, formData) {
  const email = readEmail(formData);

  if (!email) {
    return result({ error: "Enter your email." }, { email }, ["email"]);
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await readOrigin()}/auth/callback?next=/reset-password`,
  });

  // Same answer whether or not the email has an account.
  return result(
    { notice: "If that email has an account, a reset link is on its way." },
    { email },
  );
}

export async function updatePassword(previousState, formData) {
  const password = readPassword(formData);

  if (password.length < MIN_PASSWORD_LENGTH) {
    return result(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      {},
      ["password"],
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return result({ error: error.message }, {}, ["password"]);
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
