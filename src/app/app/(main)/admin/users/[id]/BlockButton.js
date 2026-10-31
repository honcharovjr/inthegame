"use client";

import ConfirmButton from "@/components/ConfirmButton/ConfirmButton";
import { LockIcon } from "@/components/icons";
import UserText from "@/components/UserText/UserText";
import { setBlocked } from "@/lib/admin/actions";
import styles from "../../admin.module.css";

export default function BlockButton({ profileId, nickname, blocked }) {
  return blocked ? (
    <ConfirmButton
      title={<>Unblock <UserText>{nickname}</UserText>?</>}
      message="They can log in again right away."
      confirmLabel="Unblock"
      triggerLabel="Unblock"
      triggerClassName={styles.smallButton}
      tone="pink"
      icon={<LockIcon size={26} />}
      action={() => setBlocked(profileId, false)}
    />
  ) : (
    <ConfirmButton
      title={<>Block <UserText>{nickname}</UserText>?</>}
      message="They cannot log in until you unblock them. A login that is open now ends within about an hour. Their sessions stay."
      confirmLabel="Block"
      triggerLabel="Block player"
      triggerClassName={styles.smallButton}
      icon={<LockIcon size={26} />}
      action={() => setBlocked(profileId, true)}
    />
  );
}
