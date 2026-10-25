"use client";

import { useState } from "react";
import styles from "../teams.module.css";

// Copies the invite link and says so for a moment.
export default function CopyLink({ link }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked. The link stays selectable on screen.
    }
  }

  return (
    <button type="button" className={styles.softButton} onClick={copy}>
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
