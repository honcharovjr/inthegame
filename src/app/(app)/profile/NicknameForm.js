"use client";

import { useActionState, useState } from "react";
import IconButton from "@/components/IconButton/IconButton";
import { CheckIcon, CloseIcon, PenIcon } from "@/components/icons";
import { updateNickname } from "@/lib/profile/actions";
import styles from "./profile.module.css";

// The player's name with a pen next to it. The pen turns the name into an
// input, and the green tick saves it.
export default function NicknameForm({ nickname }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (previous, formData) => {
      const result = await updateNickname(previous, formData);
      if (!result?.error) setEditing(false);
      return result;
    },
    { values: { nickname } },
  );

  if (!editing) {
    return (
      <div className={styles.nameRow}>
        <span className={styles.name}>{nickname}</span>
        <IconButton
          icon={<PenIcon size={18} />}
          label="Change nickname"
          size={36}
          onClick={() => setEditing(true)}
        />
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.nicknameForm}>
      <div className={styles.nameRow}>
        <input
          name="nickname"
          className={styles.input}
          type="text"
          minLength={2}
          maxLength={30}
          defaultValue={state?.error ? state.values?.nickname : nickname}
          aria-label="Nickname"
          required
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditing(false);
          }}
        />
        <IconButton
          type="submit"
          tone="green"
          icon={<CheckIcon size={20} />}
          label={pending ? "Saving" : "Save nickname"}
          size={44}
          disabled={pending}
        />
        <IconButton
          icon={<CloseIcon size={18} />}
          label="Cancel"
          size={44}
          tipAlign="end"
          onClick={() => setEditing(false)}
        />
      </div>
      {state?.error && (
        <p role="alert" className={`${styles.message} ${styles.error}`}>
          {state.error}
        </p>
      )}
    </form>
  );
}
