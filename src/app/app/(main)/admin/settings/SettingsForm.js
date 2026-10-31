"use client";

import { useState, useTransition } from "react";
import { saveSiteSettings } from "@/lib/admin/actions";
import styles from "../admin.module.css";

// The details the landing and privacy pages show. An empty field shows a
// placeholder there, so the pages work before everything is filled in.
export default function SettingsForm({ initial }) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState(null);
  const [pending, startTransition] = useTransition();
  const set = (field) => (event) => {
    setMessage(null);
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  function submit(event) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveSiteSettings(form);
      setMessage(result.error ? { error: result.error } : { ok: "Saved. The public pages show it now." });
    });
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h2 className={styles.cardTitle}>Public pages</h2>
      <p className={styles.cardText}>Shown on the privacy policy and in the landing footer.</p>
      <div className={styles.fields}>
        <label className={`${styles.field} ${styles.wide}`}>
          <span>Operator name</span>
          <input value={form.operatorName} onChange={set("operatorName")} maxLength={120} placeholder="Who runs the service" />
        </label>
        <label className={styles.field}>
          <span>Contact email</span>
          <input type="email" value={form.contactEmail} onChange={set("contactEmail")} maxLength={254} />
        </label>
        <label className={styles.field}>
          <span>Minimum age</span>
          <input type="number" min={13} max={21} value={form.minimumAge} onChange={set("minimumAge")} />
        </label>
        <label className={styles.field}>
          <span>Privacy policy last updated</span>
          <input type="date" value={form.privacyUpdatedOn} onChange={set("privacyUpdatedOn")} />
        </label>
      </div>
      {message?.error && (
        <p role="alert" className={styles.problem}>
          {message.error}
        </p>
      )}
      {message?.ok && (
        <p role="status" className={styles.cardText}>
          {message.ok}
        </p>
      )}
      <div className={styles.formActions}>
        <button type="submit" className={`${styles.smallButton} btn-primary`} disabled={pending}>
          {pending ? "Saving" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
