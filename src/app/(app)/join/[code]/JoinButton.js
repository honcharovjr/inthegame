"use client";

import { useState, useTransition } from "react";
import { joinTeam } from "@/lib/teams/actions";
import styles from "../../teams/teams.module.css";

export default function JoinButton({ code }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  function join() {
    setError(null);
    startTransition(async () => {
      const result = await joinTeam(code);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.primary} btn-primary btn-tilt`}
        onClick={join}
        disabled={pending}
      >
        {pending ? "Joining" : "Join the team"}
      </button>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </>
  );
}
