"use client";

import { useRef, useState, useTransition } from "react";
import { TrashIcon } from "@/components/icons";
import styles from "./ConfirmButton.module.css";

// A red trash button that asks in a pop-up before it deletes.
// action: async () => ({ error? }). A returned error stays in the pop-up.
export default function ConfirmButton({
  title = "Delete this?",
  message,
  confirmLabel = "Delete",
  ariaLabel = "Delete",
  triggerLabel,
  triggerClassName,
  icon,
  tone = "danger",
  action,
}) {
  const dialogRef = useRef(null);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function open() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        setError(result.error);
      } else {
        close();
      }
    });
  }

  return (
    <>
      {triggerLabel ? (
        <button
          type="button"
          className={`${triggerClassName ?? styles.textTrigger} btn-secondary`}
          onClick={open}
        >
          {triggerLabel}
        </button>
      ) : (
        <button
          type="button"
          className={styles.trash}
          aria-label={ariaLabel}
          data-tip={ariaLabel}
          data-tip-align="end"
          onClick={open}
        >
          <TrashIcon size={18} />
        </button>
      )}

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label={title}
        onClick={(event) => {
          // A click on the dimmed background closes the pop-up.
          if (event.target === event.currentTarget && !pending) close();
        }}
      >
        <div className={`${styles.panel} ${tone === "pink" ? styles.pinkTone : ""}`}>
          <span className={styles.badge} aria-hidden="true">
            {icon ?? <TrashIcon size={26} />}
          </span>
          <h2 className={styles.title}>{title}</h2>
          {message && <p className={styles.message}>{message}</p>}
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.cancel} btn-secondary`}
              onClick={close}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`${styles.confirm} btn-primary`}
              onClick={run}
              disabled={pending}
            >
              {pending ? "One moment" : confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
