"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./Toast.module.css";

const DURATION = 5000;

// A notice that drops in from the top centre, drains a bar while it waits and
// closes itself. Hovering or focusing it pauses the bar. It also has a close
// button.
// tone: success (green) | error (red).
// dismissTo: an address to replace the current one with when the notice goes,
// so a flag such as ?saved does not show it again after a reload.
export default function Toast({ message, tone = "success", dismissTo }) {
  const router = useRouter();
  const [state, setState] = useState("open");

  function close() {
    if (state !== "open") return;
    setState("leaving");
    setTimeout(() => {
      setState("gone");
      if (dismissTo) router.replace(dismissTo, { scroll: false });
    }, 260);
  }

  if (state === "gone") return null;

  return (
    <div
      className={`${styles.toast} ${styles[tone]} ${state === "leaving" ? styles.leaving : ""}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <span className={styles.icon} aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={tone === "error" ? "M12 6v8M12 18v.1" : "M5 12.5l4.5 4.5L19 7.5"} />
        </svg>
      </span>
      <span className={styles.text}>{message}</span>
      <button
        type="button"
        className={styles.close}
        aria-label="Close notification"
        onClick={close}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <span
        className={styles.bar}
        style={{ animationDuration: `${DURATION}ms` }}
        onAnimationEnd={close}
        aria-hidden="true"
      />
    </div>
  );
}
