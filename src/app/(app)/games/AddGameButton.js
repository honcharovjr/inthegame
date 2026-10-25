"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AddGameForm from "@/components/AddGameForm/AddGameForm";
import { PlusIcon } from "@/components/icons";
import styles from "./games.module.css";

// Opens the custom game form in place. A new game appears in the list at once.
export default function AddGameButton({ existingNames }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <AddGameForm
        existingNames={existingNames}
        onCancel={() => setOpen(false)}
        onAdded={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    );
  }

  return (
    <button type="button" className={styles.addButton} onClick={() => setOpen(true)}>
      <PlusIcon size={16} />
      Add a custom game
    </button>
  );
}
