"use client";

import { useActionState } from "react";
import { createTeam } from "@/lib/teams/actions";
import styles from "./teams.module.css";

export default function CreateTeamForm() {
  const [state, formAction, pending] = useActionState(createTeam, {});

  return (
    <form action={formAction} className={styles.createForm}>
      <label className={styles.label} htmlFor="team-name">
        Start a team
      </label>
      <div className={styles.createRow}>
        <input
          id="team-name"
          name="name"
          className={styles.input}
          type="text"
          maxLength={60}
          placeholder="For example Friday Night"
          defaultValue={state?.values?.name}
          required
        />
        <button type="submit" className={`${styles.primary} btn-primary`} disabled={pending}>
          {pending ? "Creating" : "Create"}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className={styles.error}>
          {state.error}
        </p>
      )}
    </form>
  );
}
