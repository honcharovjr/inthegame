import UserText from "@/components/UserText/UserText";
import TopBar from "./TopBar";
import ui from "./play.module.css";

// How do you play: solo, on this phone, or by invite. Without onInvite the
// invite option shows as coming soon. A game in progress can be continued
// or discarded from here.
// resume: { participants, progress, onContinue, onDiscard } or null.
export default function ModeScreen({ title, soloArt, soloText, maxPlayers, onSolo, onPhone, onInvite, resume }) {
  return (
    <main className={ui.page}>
      <div className={ui.column}>
        <TopBar title={title} backHref="/app/games/play" />
        <h1 className={ui.headline}>
          How do
          <br />
          you play?
        </h1>

        {resume && (
          <section className={ui.resume}>
            <div className={ui.resumeText}>
              <strong>Game in progress</strong>
              <span>
                {resume.participants.length === 1
                  ? "Solo"
                  : resume.participants.map((item, index) => (
                      <span key={item.key}>
                        {index > 0 && ", "}
                        <UserText>{item.name}</UserText>
                      </span>
                    ))}{" "}
                · {resume.progress}
              </span>
            </div>
            <div className={ui.resumeActions}>
              <button type="button" className={ui.primary} onClick={resume.onContinue}>
                Continue
              </button>
              <button type="button" className={ui.ghost} onClick={resume.onDiscard}>
                Discard
              </button>
            </div>
          </section>
        )}

        <div className={`${ui.modes} stagger`}>
          <button type="button" className={`${ui.mode} ${ui.modeSolo}`} onClick={onSolo}>
            {soloArt}
            <span className={ui.modeTitle}>Solo</span>
            <span className={ui.modeText}>{soloText}</span>
          </button>

          <p className={ui.modeLabel}>With friends</p>
          <button type="button" className={`${ui.mode} ${ui.modePhone}`} onClick={onPhone}>
            <span className={ui.modeTitle}>On this phone</span>
            <span className={ui.modeText}>Pass the phone around. Up to {maxPlayers} players.</span>
          </button>
          {onInvite ? (
            <button type="button" className={`${ui.mode} ${ui.modeInvite}`} onClick={onInvite}>
              <span className={ui.modeTitle}>Invite friends</span>
              <span className={ui.modeText}>
                Teammates get an invite and join from their own phone or computer.
              </span>
            </button>
          ) : (
            <div className={`${ui.mode} ${ui.modeSoon}`} aria-disabled="true">
              <span className={ui.soonBadge}>Coming soon</span>
              <span className={ui.modeTitle}>Invite friends</span>
              <span className={ui.modeText}>
                Send an invite. Friends get a notification and join from their own phones.
              </span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
