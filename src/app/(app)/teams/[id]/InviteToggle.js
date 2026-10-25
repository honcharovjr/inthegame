"use client";

import { useState, useTransition } from "react";
import IconButton from "@/components/IconButton/IconButton";
import { LinkIcon, LinkOffIcon } from "@/components/icons";
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
      <IconButton
        tipAlign="end"
        label={enabled ? "Turn the invite link off" : "Turn the invite link on"}
        icon={enabled ? <LinkOffIcon size={20} /> : <LinkIcon size={20} />}
        onClick={toggle}
        disabled={pending}
      />
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </>
  );
}
