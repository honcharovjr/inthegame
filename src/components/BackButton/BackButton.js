"use client";

import { useRouter } from "next/navigation";
import IconButton from "@/components/IconButton/IconButton";
import { ArrowLeftIcon } from "@/components/icons";

// Goes back to where the player came from. A page opened directly, with
// nothing to go back to, goes to fallback instead.
export default function BackButton({ fallback = "/" }) {
  const router = useRouter();

  return (
    <IconButton
      tone="white"
      size={40}
      label="Back"
      icon={<ArrowLeftIcon size={20} />}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
    />
  );
}
