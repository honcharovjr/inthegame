"use client";

import { useState } from "react";
import IconButton from "@/components/IconButton/IconButton";
import { CheckIcon, CopyIcon } from "@/components/icons";

// Copies the invite link. The icon turns into a check for a moment.
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
    <IconButton
      tone="pink"
      label={copied ? "Copied" : "Copy invite link"}
      icon={copied ? <CheckIcon size={20} /> : <CopyIcon size={20} />}
      onClick={copy}
    />
  );
}
