"use client";

import { useState, useTransition } from "react";
import { setInviteEnabled } from "@/lib/teams/actions";
import styles from "../teams.module.css";

// Owner only: switch the invite link off and on.
export default function InviteToggle({ teamId, enabled }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await setInviteEnabled(teamId, !enabled);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.softButton} ${styles.quiet}`}
        onClick={toggle}
        disabled={pending}
      >
        {enabled ? "Turn link off" : "Turn link on"}
      </button>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </>
  );
}
