import Link from "next/link";
import Chip from "@/components/Chip/Chip";
import ConfirmButton from "@/components/ConfirmButton/ConfirmButton";
import { PenIcon } from "@/components/icons";
import UserText, { GameName } from "@/components/UserText/UserText";
import { gameEmoji } from "@/lib/games/emoji";
import { deleteSession } from "@/lib/sessions/actions";
import styles from "./teams.module.css";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

// The session history of a panel (a team or personal). The player who
// logged a session can edit or delete it here, and only here.
// pageHref(page) gives the address of another page of the list.
export default function SessionHistory({ title, sessions, profileId, page, totalPages, pageHref, empty }) {
  return (
    <section className={styles.card} aria-label={title}>
      <div className={styles.cardTitle}>{title}</div>
      {sessions.length === 0 ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        <ul className={styles.sessions}>
          {sessions.map((session) => {
            const names = session.session_participants
              .map((p) => p.profiles?.nickname ?? p.guests?.name)
              .filter(Boolean);
            const winner = session.session_participants.find((p) => p.place === 1);
            const gameText = session.games?.name ?? "game";
            const mine = session.created_by === profileId;
            return (
              <li key={session.id} className={styles.sessionRow}>
                <span className={styles.tile} aria-hidden="true">
                  {gameEmoji(session.games)}
                </span>
                <span className={styles.sessionText}>
                  <span className={styles.sessionName}>
                    <GameName game={session.games} />
                  </span>
                  <span className={styles.chips}>
                    <Chip size="s">{dateFormat.format(new Date(session.played_at))}</Chip>
                    {names.slice(0, 3).map((name) => (
                      <Chip key={name} size="s">
                        <UserText>{name}</UserText>
                      </Chip>
                    ))}
                    {winner && session.session_participants.length > 1 && (
                      <Chip size="s" tone="pink">
                        <span>
                          <UserText>{winner.profiles?.nickname ?? winner.guests?.name}</UserText> won
                        </span>
                      </Chip>
                    )}
                  </span>
                </span>
                {mine && (
                  <span className={styles.sessionActions}>
                    <Link
                      href={`/log?edit=${session.id}`}
                      className={styles.edit}
                      aria-label={`Edit the ${gameText} session`}
                      data-tip="Edit"
                      data-tip-align="end"
                    >
                      <PenIcon size={17} />
                    </Link>
                    <ConfirmButton
                      title="Delete this session?"
                      message={
                        <>
                          <GameName game={session.games} /> on{" "}
                          {dateFormat.format(new Date(session.played_at))} will be removed and
                          ratings will be recalculated.
                        </>
                      }
                      confirmLabel="Delete session"
                      ariaLabel={`Delete the ${gameText} session`}
                      action={deleteSession.bind(null, session.id)}
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {totalPages > 1 && (
        <nav className={styles.pager} aria-label="Pages">
          {page > 1 && (
            <Chip href={pageHref(page - 1)} tone="white" scroll={false}>
              Previous
            </Chip>
          )}
          <Chip tone="pink">
            Page {page} of {totalPages}
          </Chip>
          {page < totalPages && (
            <Chip href={pageHref(page + 1)} tone="white" scroll={false}>
              Next
            </Chip>
          )}
        </nav>
      )}
    </section>
  );
}
