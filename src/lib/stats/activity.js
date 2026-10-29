const DAY = 24 * 60 * 60 * 1000;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

// The activity calendar: one cell per day for the last `weeks` weeks, a
// column per week from Monday to Sunday, the current week last. dates: when
// each session was played. today: the date the calendar ends on (UTC days).
// Returns { cells, months }. A cell is { date, count, level }, level 0 to 4
// by sessions that day; days after today have level -1. months marks the
// first column of each month: { label, column }.
export function activityCalendar(dates, today, weeks = 26) {
  const counts = new Map();
  for (const date of dates) {
    const key = dayKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const end = new Date(`${dayKey(today)}T00:00:00Z`);
  const mondayOffset = (end.getUTCDay() + 6) % 7;
  const start = new Date(end.getTime() - (mondayOffset + (weeks - 1) * 7) * DAY);

  const cells = [];
  const months = [];
  for (let i = 0; i < weeks * 7; i += 1) {
    const day = new Date(start.getTime() + i * DAY);
    const key = dayKey(day);
    const count = counts.get(key) ?? 0;
    const future = day > end;
    cells.push({ date: key, count, level: future ? -1 : Math.min(count, 4) });
    if (i % 7 === 0) {
      const label = MONTHS[day.getUTCMonth()];
      if (months.at(-1)?.label !== label) months.push({ label, column: i / 7 });
    }
  }
  return { cells, months };
}
