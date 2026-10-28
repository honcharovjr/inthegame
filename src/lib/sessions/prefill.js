// Turns a saved session back into what the log flow edits, so a player can
// fix a session with the same screens they logged it with. Pure, so tested.
// Keys follow the log flow: "me", "p:<profile id>" for a teammate, or a
// guest id.

// session: { id, game_id, team_id, result_type,
//   session_participants: [{ profile_id, guest_id, place, score }] }
// myProfileId: the editing player. team: { id, members: [{ id }] } or null,
// the session's team as the player sees it now (null when they left it).
export function prefillFromSession(session, myProfileId, team) {
  const members = new Set((team?.members ?? []).map((member) => member.id));
  const dropped = [];
  const rows = [];

  for (const p of session.session_participants) {
    let key;
    if (p.profile_id === myProfileId) key = "me";
    else if (p.profile_id && members.has(p.profile_id)) key = `p:${p.profile_id}`;
    else if (p.guest_id) key = p.guest_id;
    if (key) rows.push({ key, place: p.place, score: p.score });
    else dropped.push(p.profile_id);
  }
  // The editor always takes part, as when logging.
  if (!rows.some((row) => row.key === "me")) {
    rows.push({ key: "me", place: rows.length + 1, score: null });
  }

  const sorted = [...rows].sort((a, b) => a.place - b.place);
  const order = sorted.map((row) => row.key);
  const tied = {};
  sorted.forEach((row, index) => {
    if (index > 0 && row.place === sorted[index - 1].place) tied[row.key] = true;
  });

  const scores = {};
  let tiebreak = null;
  if (session.result_type === "points") {
    for (const row of rows) scores[row.key] = row.score === null ? "" : String(Number(row.score));
    // Equal top scores with a single place 1 means a winner was chosen.
    const top = Math.max(...rows.map((row) => Number(row.score ?? 0)));
    const leaders = rows.filter((row) => Number(row.score ?? 0) === top);
    const firsts = leaders.filter((row) => row.place === 1);
    if (leaders.length > 1 && firsts.length === 1) tiebreak = firsts[0].key;
  }

  const winner = sorted[0]?.place === 1 ? sorted[0].key : "me";

  return {
    sessionId: session.id,
    gameId: session.game_id,
    teamId: team ? session.team_id : null,
    memberIds: rows.filter((row) => row.key.startsWith("p:")).map((row) => row.key.slice(2)),
    guestIds: rows
      .filter((row) => row.key !== "me" && !row.key.startsWith("p:"))
      .map((row) => row.key),
    resultType: session.result_type,
    winner,
    order,
    tied,
    scores,
    tiebreak,
    droppedCount: dropped.length,
  };
}
