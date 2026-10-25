"use client";

import { useActionState } from "react";
import { updateNickname } from "@/lib/profile/actions";
import styles from "./profile.module.css";

export default function NicknameForm({ nickname }) {
  const [state, formAction, pending] = useActionState(updateNickname, {
    values: { nickname },
  });

  return (
    <form action={formAction} className={styles.nicknameForm}>
      <label className={styles.label} htmlFor="nickname">
        Nickname
      </label>
      <div className={styles.nicknameRow}>
        <input
          id="nickname"
          name="nickname"
          className={styles.input}
          type="text"
          minLength={2}
          maxLength={30}
          defaultValue={state?.values?.nickname ?? nickname}
          required
        />
        <button type="submit" className={styles.save} disabled={pending}>
          {pending ? "Saving" : "Save"}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className={`${styles.message} ${styles.error}`}>
          {state.error}
        </p>
      )}
      {state?.notice && (
        <p role="status" className={`${styles.message} ${styles.notice}`}>
          {state.notice}
        </p>
      )}
    </form>
  );
}
