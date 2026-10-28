"use client";

import { useState, useTransition } from "react";
import Chip from "@/components/Chip/Chip";
import ConfirmButton from "@/components/ConfirmButton/ConfirmButton";
import { PenIcon, PlusIcon } from "@/components/icons";
import { deleteCatalogGame, promoteGame, saveCatalogGame } from "@/lib/admin/actions";
import { gameEmoji } from "@/lib/games/emoji";
import { GAME_TYPES, findGameType } from "@/lib/games/types";
import styles from "../admin.module.css";

const EMPTY = {
  name: "",
  emoji: "",
  type: "board",
  minPlayers: "2",
  maxPlayers: "4",
  duration: "",
  description: "",
  isClassic: false,
};

function toForm(game) {
  return {
    id: game.id,
    name: game.name,
    emoji: game.emoji ?? "",
    type: game.type,
    minPlayers: String(game.min_players),
    maxPlayers: String(game.max_players),
    duration: game.typical_duration_min ? String(game.typical_duration_min) : "",
    description: game.description ?? "",
    isClassic: game.is_classic,
  };
}

// Catalog games with add, edit and delete, and players' custom games that
// can be moved into the catalog.
export default function CatalogManager({ catalog, custom }) {
  // null, "new" or the id of the game being edited
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");

  const text = query.trim().toLowerCase();
  const shown = text ? catalog.filter((g) => g.name.toLowerCase().includes(text)) : catalog;

  return (
    <div className={styles.stack}>
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${catalog.length} games`}
          aria-label="Search catalog games"
        />
        <button type="button" className={`${styles.addButton} btn-primary`} onClick={() => setEditing("new")}>
          <PlusIcon size={18} />
          Add game
        </button>
      </div>

      {editing === "new" && (
        <GameForm initial={EMPTY} onDone={() => setEditing(null)} />
      )}

      <ul className={`${styles.list} stagger`}>
        {shown.map((game) =>
          editing === game.id ? (
            <li key={game.id}>
              <GameForm initial={toForm(game)} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={game.id} className={styles.row}>
              <GameSummary game={game} />
              <button
                type="button"
                className={styles.iconButton}
                aria-label={`Edit ${game.name}`}
                data-tip="Edit"
                onClick={() => setEditing(game.id)}
              >
                <PenIcon size={18} />
              </button>
              {game.sessionsCount === 0 ? (
                <ConfirmButton
                  title={`Delete ${game.name}?`}
                  message="It leaves the catalog for everyone. No session uses it."
                  ariaLabel={`Delete ${game.name}`}
                  action={() => deleteCatalogGame(game.id)}
                />
              ) : (
                <span className={styles.locked} data-tip="Used by sessions, cannot be deleted" data-tip-align="end">
                  {game.sessionsCount}
                </span>
              )}
            </li>
          ),
        )}
      </ul>
      {shown.length === 0 && <p className={styles.empty}>No catalog games match.</p>}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Players&apos; custom games</h2>
        <p className={styles.cardText}>
          Add a good one to the catalog and every player will see it. It stays the same game, so its
          sessions and ratings carry over.
        </p>
        {custom.length === 0 ? (
          <p className={styles.empty}>No custom games yet.</p>
        ) : (
          <ul className={styles.list}>
            {custom.map((game) => (
              <li key={game.id} className={`${styles.row} ${styles.rowFlat}`}>
                <GameSummary game={game} author={game.author} />
                <ConfirmButton
                  title={`Add ${game.name} to the catalog?`}
                  message="Every player will see it. Its author can no longer edit it."
                  confirmLabel="Add to catalog"
                  triggerLabel="Add to catalog"
                  triggerClassName={styles.smallButton}
                  tone="pink"
                  icon={<PlusIcon size={26} />}
                  action={() => promoteGame(game.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function GameSummary({ game, author }) {
  const type = findGameType(game.type);
  return (
    <>
      <span className={`${styles.emoji} ${styles[`tile_${type.tone}`] ?? ""}`} aria-hidden="true">
        {gameEmoji(game)}
      </span>
      <span className={styles.rowText}>
        <span className={styles.rowName}>{game.name}</span>
        <span className={styles.rowMeta}>
          {game.min_players === game.max_players
            ? `${game.min_players} players`
            : `${game.min_players} to ${game.max_players} players`}
          {game.typical_duration_min ? ` · ${game.typical_duration_min} min` : ""}
          {` · ${game.sessionsCount} sessions`}
          {author ? ` · by ${author}` : ""}
        </span>
        <span className={styles.rowChips}>
          <Chip size="s" tone={type.tone}>
            {type.label}
          </Chip>
          {game.is_classic && (
            <Chip size="s" tone="turquoise">
              Classic
            </Chip>
          )}
        </span>
      </span>
    </>
  );
}

function GameForm({ initial, onDone }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
  const set = (field) => (event) =>
    setForm((current) => ({
      ...current,
      [field]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    }));

  function submit(event) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveCatalogGame(form);
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h2 className={styles.cardTitle}>{form.id ? `Edit ${initial.name}` : "New catalog game"}</h2>
      <div className={styles.fields}>
        <label className={`${styles.field} ${styles.wide}`}>
          <span>Name</span>
          <input value={form.name} onChange={set("name")} maxLength={60} required autoFocus />
        </label>
        <label className={styles.field}>
          <span>Emoji</span>
          <input value={form.emoji} onChange={set("emoji")} maxLength={8} placeholder="Optional" />
        </label>
        <label className={styles.field}>
          <span>Type</span>
          <select value={form.type} onChange={set("type")}>
            {GAME_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Min players</span>
          <input type="number" min={1} max={50} value={form.minPlayers} onChange={set("minPlayers")} required />
        </label>
        <label className={styles.field}>
          <span>Max players</span>
          <input type="number" min={1} max={50} value={form.maxPlayers} onChange={set("maxPlayers")} required />
        </label>
        <label className={styles.field}>
          <span>Minutes</span>
          <input type="number" min={1} max={1440} value={form.duration} onChange={set("duration")} placeholder="Optional" />
        </label>
        <label className={`${styles.field} ${styles.wide}`}>
          <span>Description</span>
          <textarea value={form.description} onChange={set("description")} maxLength={300} rows={2} placeholder="Optional" />
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={form.isClassic} onChange={set("isClassic")} />
          Classic game, needs no box
        </label>
      </div>
      {error && (
        <p role="alert" className={styles.problem}>
          {error}
        </p>
      )}
      <div className={styles.formActions}>
        <button type="button" className={`${styles.smallButton} btn-secondary`} onClick={onDone} disabled={pending}>
          Cancel
        </button>
        <button type="submit" className={`${styles.smallButton} btn-primary`} disabled={pending}>
          {pending ? "Saving" : "Save game"}
        </button>
      </div>
    </form>
  );
}
