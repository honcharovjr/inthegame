import Avatar from "@/components/Avatar/Avatar";
import UserText from "@/components/UserText/UserText";
import ui from "./play.module.css";

// Pass the phone: who plays next, after a line about the last move.
export default function Handoff({ message, next, onReady }) {
  return (
    <div className={ui.overlay} role="dialog" aria-modal="true" aria-label="Next player">
      <div className={ui.handoff}>
        {message && <p className={ui.handoffLast}>{message}</p>}
        <Avatar name={next.name} size={96} color={next.color} registered={next.registered} character={next.character} />
        <p className={ui.handoffName}>
          {next.key === "me" ? "Your turn" : <><UserText>{next.name}</UserText>&apos;s turn</>}
        </p>
        <p className={ui.handoffHint}>Pass the phone</p>
        <button type="button" className={`${ui.primary} ${ui.big}`} onClick={onReady} autoFocus>
          {next.key === "me" ? "Let's go" : <span>I&apos;m <UserText>{next.name}</UserText></span>}
        </button>
      </div>
    </div>
  );
}
