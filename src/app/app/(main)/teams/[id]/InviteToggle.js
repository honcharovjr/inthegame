"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setInviteEnabled } from "@/lib/teams/actions";
import styles from "../teams.module.css";

// The switch of the invite link. Only the owner can flip it, everybody else
// sees its state. It moves at once and goes back if saving fails.
export default function InviteToggle({ teamId, enabled, canEdit }) {
  const [, startTransition] = useTransition();
  const [on, setOn] = useOptimistic(enabled);
  const [error, setError] = useState(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      setOn(!on);
      const result = await setInviteEnabled(teamId, !on);
      if (result?.error) setError(result.error);
    });
  }

  const tip = !canEdit
    ? on
      ? "Invite link is on. Only the owner can change it"
      : "Invite link is off. Only the owner can change it"
    : on
      ? "Link is on. Click to turn it off"
      : "Link is off. Click to turn it on";

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Invite link"
        className={`${styles.switch} ${on ? styles.switchOn : ""}`}
        disabled={!canEdit}
        onClick={toggle}
        data-tip={tip}
        data-tip-align="end"
      >
        <span className={styles.knob} />
      </button>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </>
  );
}
