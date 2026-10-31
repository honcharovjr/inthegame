"use client";

import ConfirmButton from "@/components/ConfirmButton/ConfirmButton";
import { ResetIcon } from "@/components/icons";
import { rebuildAllRatings } from "@/lib/admin/actions";

// Recomputes every rating from the sessions, after it asks.
export default function RebuildRatings() {
  return (
    <ConfirmButton
      title="Rebuild all ratings?"
      message="Every rating is computed again from the sessions, with the current rules. Sessions with a guest change no rating. This can take a minute."
      confirmLabel="Rebuild"
      triggerLabel="Rebuild ratings"
      icon={<ResetIcon size={26} />}
      tone="pink"
      action={rebuildAllRatings}
    />
  );
}
