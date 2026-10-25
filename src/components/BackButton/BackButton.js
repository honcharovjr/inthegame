"use client";

import { useRouter } from "next/navigation";
import IconButton from "@/components/IconButton/IconButton";
import { ArrowLeftIcon } from "@/components/icons";

// Goes back to where the player came from. A page opened directly, with
// nothing to go back to, goes to fallback instead. With `to`, it always goes
// there, whatever came before.
export default function BackButton({ fallback = "/", to }) {
  const router = useRouter();

  return (
    <IconButton
      tone="white"
      size={40}
      label="Back"
      icon={<ArrowLeftIcon size={20} />}
      onClick={() => {
        if (to) router.push(to);
        else if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
    />
  );
}
