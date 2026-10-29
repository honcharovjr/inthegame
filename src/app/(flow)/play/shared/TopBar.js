import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import ui from "./play.module.css";

// The bar at the top of a game. Give backHref for a link or onBack for a
// button. children sit on the right, such as the round.
export default function TopBar({ title, backHref, onBack, children }) {
  const icon = <ArrowLeftIcon size={20} />;
  return (
    <div className={ui.top}>
      {onBack ? (
        <button type="button" className={ui.back} onClick={onBack} aria-label="Back" data-tip="Back" data-tip-pos="below">
          {icon}
        </button>
      ) : (
        <Link href={backHref} className={ui.back} aria-label="Back" data-tip="Back" data-tip-pos="below">
          {icon}
        </Link>
      )}
      <span className={ui.title}>{title}</span>
      {children ?? <span />}
    </div>
  );
}
