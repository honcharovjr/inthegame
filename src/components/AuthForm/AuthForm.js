"use client";

import Link from "next/link";
import { useActionState } from "react";
import styles from "./AuthForm.module.css";

// A form that runs a server action and shows its error or notice.
// fields: [{ name, label, type, autoComplete, placeholder }]
// links: [{ href, label, muted }]
export default function AuthForm({
  action,
  fields,
  submitLabel,
  links = [],
  initialError = null,
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: initialError,
  });

  return (
    <form action={formAction} className={styles.form}>
      {fields.map((field) => (
        <div key={field.name}>
          <label className={styles.label} htmlFor={field.name}>
            {field.label}
          </label>
          <input
            className={styles.input}
            id={field.name}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            // Keep what was typed after a failed try, except passwords.
            defaultValue={
              field.type === "password" ? undefined : state?.values?.[field.name]
            }
            required
          />
        </div>
      ))}

      {state?.error && (
        <p role="alert" className={`${styles.message} ${styles.error}`}>
          {state.error}
        </p>
      )}
      {state?.notice && (
        <p role="status" className={`${styles.message} ${styles.notice}`}>
          {state.notice}
        </p>
      )}

      <button className={styles.button} type="submit" disabled={pending}>
        {pending ? "Please wait" : submitLabel}
      </button>

      {links.length > 0 && (
        <div className={styles.links}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={link.muted ? styles.muted : styles.strong}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </form>
  );
}
