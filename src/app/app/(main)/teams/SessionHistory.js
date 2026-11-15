import Link from "next/link";
import ConfirmButton from "@/components/ConfirmButton/ConfirmButton";
import { PenIcon } from "@/components/icons";
import Chip from "@/components/Chip/Chip";
import Pager from "@/components/Pager/Pager";
import SessionRow from "@/components/SessionRow/SessionRow";
import UserText, { GameName } from "@/components/UserText/UserText";
import { gameEmoji } from "@/lib/games/emoji";
import { findGameType } from "@/lib/games/types";
import { deleteSession } from "@/lib/sessions/actions";
import { resultLabel } from "@/lib/stats/month";
import styles from "./teams.module.css";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

// The session history of a panel (a team or personal). Its rows are the same
// as on History. The player who logged a session can edit or delete it here,
// and only here. pageHref(page) gives the address of another page of the list.
export default function SessionHistory({ title, sessions, profileId, page, totalPages, pageHref, empty }) {
  return (
    <section className={styles.history} aria-label={title}>
      <h2 className={styles.cardTitle}>{title}</h2>
      {sessions.length === 0 ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        <ul className={`${styles.sessions} stagger`}>
          {sessions.map((session) => {
            const people = session.session_participants;
            const nameOf = (p) => p.profiles?.nickname ?? p.guests?.name;
            const mine = people.find((p) => p.profile_id === profileId);
            const winner = people.find((p) => p.place === 1);
            // The names of the others, or of everyone when the viewer did not play
            const others = people.filter((p) => p !== mine).map(nameOf).filter(Boolean);
            const gameText = session.games?.name ?? "game";
            const date = dateFormat.format(new Date(session.played_at));
            const unrated = people.length < 2 || people.some((p) => p.guest_id);
            return (
              <SessionRow
                key={session.id}
                emoji={gameEmoji(session.games)}
                tone={findGameType(session.games?.type).tone}
                name={<GameName game={session.games} />}
                chips={
                  unrated && (
                    <span data-tip="Sessions with a guest or one player do not change ratings">
                      <Chip size="s">Unrated</Chip>
                    </span>
                  )
                }
                meta={[
                  date,
                  others.length > 0 && (
                    <>
                      {mine && "with "}
                      <UserText>{others.slice(0, 3).join(", ")}</UserText>
                    </>
                  ),
                  !mine && winner && people.length > 1 && (
                    <>
                      <UserText>{nameOf(winner)}</UserText> won
                    </>
                  ),
                ]}
                result={mine ? resultLabel(mine.place ?? 0, people.length) : null}
                won={mine?.place === 1 && people.length >= 2}
                actions={
                  session.created_by === profileId && (
                    <>
                      <Link
                        href={`/app/log?edit=${session.id}`}
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
                            <GameName game={session.games} /> on {date} will be removed and ratings
                            will be recalculated.
                          </>
                        }
                        confirmLabel="Delete session"
                        ariaLabel={`Delete the ${gameText} session`}
                        action={deleteSession.bind(null, session.id)}
                      />
                    </>
                  )
                }
              />
            );
          })}
        </ul>
      )}
      {totalPages > 1 && (
        <Pager page={page} total={totalPages} prevHref={pageHref(page - 1)} nextHref={pageHref(page + 1)} />
      )}
    </section>
  );
}
