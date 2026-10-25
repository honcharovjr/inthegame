"use client";

import { useActionState } from "react";
import { addGuest } from "@/lib/sessions/actions";
import styles from "../flow.module.css";

// A guest has a name only. Adding one selects it for this session.
export default function AddGuestForm({ gameId, selectedIds }) {
  const [state, formAction, pending] = useActionState(
    addGuest.bind(null, gameId, selectedIds),
    { error: null },
  );

  return (
    <form action={formAction}>
      <div className={styles.guestForm}>
        <input
          className={styles.guestInput}
          name="name"
          type="text"
          maxLength={30}
          placeholder="Add a guest by name"
          aria-label="Guest name"
          required
        />
        <button type="submit" className={styles.small} disabled={pending}>
          {pending ? "Adding" : "Add"}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className={styles.message} style={{ marginTop: 8 }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
