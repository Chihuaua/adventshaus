export interface ScoreEntry {
  name: string;
  score: number;
  day: number;
  wishes: number;
  ts: number;
}

const KEY = "lcp1.records.v1";
const MUTED = "lcp1.muted.v1";

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedScores();
    const parsed = JSON.parse(raw) as ScoreEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedScores();
    return parsed
      .filter((e) => e && typeof e.score === "number")
      .slice(0, 8)
      .sort((a, b) => b.score - a.score);
  } catch {
    return seedScores();
  }
}

function seedScores(): ScoreEntry[] {
  const seed: ScoreEntry[] = [
    { name: "MAX", score: 24800, day: 12, wishes: 74, ts: Date.now() - 86400000 * 3 },
    { name: "DOT", score: 15400, day: 9, wishes: 46, ts: Date.now() - 86400000 * 5 },
    { name: "PIX", score: 9200, day: 6, wishes: 27, ts: Date.now() - 86400000 * 8 },
    { name: "ZED", score: 4600, day: 4, wishes: 13, ts: Date.now() - 86400000 * 10 },
    { name: "CPU", score: 1800, day: 2, wishes: 5, ts: Date.now() - 86400000 * 13 },
  ];
  saveScores(seed);
  return seed;
}

export function saveScores(list: ScoreEntry[]): ScoreEntry[] {
  const next = [...list].sort((a, b) => b.score - a.score).slice(0, 8);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / privacy errors */
  }
  return next;
}

export function submitScore(entry: ScoreEntry): { list: ScoreEntry[]; rank: number } {
  const list = loadScores();
  const next = saveScores([...list, entry]);
  const rank = next.findIndex((e) => e.ts === entry.ts && e.name === entry.name);
  return { list: next, rank };
}

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTED) === "1";
  } catch {
    return false;
  }
}

export function saveMuted(v: boolean) {
  try {
    localStorage.setItem(MUTED, v ? "1" : "0");
  } catch {
    /* ignore */
  }
}
