"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertIcon } from "@/components/icons";
import Toast from "@/components/Toast/Toast";
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
  hidden = {},
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: initialError,
  });

  return (
    <>
      {/* Messages float above the page, so the card never changes size */}
      {state?.error && <Toast key={state.at ?? "initial"} message={state.error} tone="error" />}
      {state?.notice && <Toast key={state.at} message={state.notice} tone="success" />}
    <form action={formAction} className={`${styles.form} ${styles.rise}`}>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {fields.map((field) => {
        const invalid = state?.error && state?.fields?.includes(field.name);
        return (
          <div key={field.name}>
            <label className={styles.label} htmlFor={field.name}>
              {field.label}
            </label>
            <div className={styles.field}>
              <input
                key={state?.at}
                className={`${styles.input} ${invalid ? styles.invalid : ""}`}
                id={field.name}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                aria-invalid={invalid ? "true" : undefined}
                // Keep what was typed after a failed try, except passwords.
                defaultValue={
                  field.type === "password"
                    ? undefined
                    : state?.values?.[field.name]
                }
                required
              />
              {invalid && (
                <span
                  className={styles.errorIcon}
                  data-tip={state.error}
                  data-tip-align="end"
                  tabIndex={0}
                  role="img"
                  aria-label={state.error}
                >
                  <AlertIcon size={20} />
                </span>
              )}
            </div>
          </div>
        );
      })}

      <button className={`${styles.button} btn-primary`} type="submit" disabled={pending}>
        {pending ? "Please wait" : submitLabel}
      </button>

      {links.length > 0 && (
        <div className={styles.links}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${link.muted ? styles.muted : styles.strong} btn-text`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </form>
    </>
  );
}
