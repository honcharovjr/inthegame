import { CalendarIcon } from "@/components/icons";
import styles from "./PlayingSince.module.css";

const format = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
});

// The month the player joined, as a calendar icon and a short date such as
// "Oct, 2026". The words "Playing since" show as a tooltip.
export default function PlayingSince({ date }) {
  const parts = format.formatToParts(new Date(date));
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;

  return (
    <span
      className={styles.since}
      data-tip="Playing since"
      data-tip-pos="below"
      tabIndex={0}
    >
      <CalendarIcon size={16} />
      <span>{`${month}, ${year}`}</span>
    </span>
  );
}
