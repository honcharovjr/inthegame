"use client";

import { useState, useTransition } from "react";
import styles from "./ConfirmButton.module.css";

// A destructive button that asks twice. The first tap shows Cancel and a
// confirm button, the second runs the action.
// action: async () => ({ error? }). A returned error is shown under the button.
export default function ConfirmButton({
  label = "Delete",
  confirmLabel = "Yes, delete",
  action,
}) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        setError(result.error);
      }
      setAsking(false);
    });
  }

  return (
    <div className={styles.wrap}>
      {asking ? (
        <div className={styles.row}>
          <button
            type="button"
            className={styles.cancel}
            onClick={() => setAsking(false)}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirm}
            onClick={run}
            disabled={pending}
          >
            {pending ? "Deleting" : confirmLabel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={styles.ask}
          onClick={() => setAsking(true)}
        >
          {label}
        </button>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
