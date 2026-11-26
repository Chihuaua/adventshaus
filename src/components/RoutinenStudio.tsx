import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuniStage } from "@/components/LuniStage";
import { ProbeBuehne, type Ansicht, type ProbeGriff } from "@/components/ProbeBuehne";
import { DUSCH_CODES, type DuschTat } from "@/game/duschprogramm";
import { sfx } from "@/game/audio";
import type { LuniExpr, LuniState } from "@/game/luni";
import {
  PROBE_KETTEN,
  basisRoutinen,
  ketteAusKurzcode,
  ketteKurzcode,
  kettenBausteine,
  routinenKategorien,
  type KettenGlied,
  type Routine,
} from "@/game/routinen";

const SCHLUESSEL = "lcp1.studio.ketten";
interface Gespeichert { name: string; glieder: KettenGlied[] }

function ladeKetten(): Gespeichert[] {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    const liste = roh ? (JSON.parse(roh) as Gespeichert[]) : [];
    return Array.isArray(liste) ? liste.filter((k) => k && Array.isArray(k.glieder)) : [];
  } catch {
    return [];
  }
}
function speichereKetten(liste: Gespeichert[]) {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(liste));
  } catch {
    /* ohne Speicher weiter */
  }
}

function Knopf({ aktiv, onClick, children, titel, breit }: { aktiv?: boolean; onClick: () => void; children: React.ReactNode; titel?: string; breit?: boolean }) {
  return (
    <button
      type="button"
      title={titel}
      aria-pressed={aktiv}
      onClick={onClick}
      className={`btn-press min-h-8 rounded-md px-2.5 py-1.5 text-[11px] font-medium tracking-wide transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${breit ? "flex-1" : ""} ${
        aktiv
          ? "bg-teal text-[#04211d] shadow-[0_0_14px_-4px_rgba(53,214,192,.85)]"
          : "bg-[#132a33] text-mint-200 ring-1 ring-white/10 hover:bg-ink-700 hover:text-mint-50"
      }`}
    >
      {children}
    </button>
  );
}

function Regler({ titel, wert, min, max, schritt, einheit, onChange }: {
  titel: string; wert: number; min: number; max: number; schritt: number; einheit?: string; onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between text-[11px] text-mint-400">
        {titel}
        <span className="tabular-nums text-mint-100">{wert.toFixed(2)}{einheit ?? "×"}</span>
      </span>
      <input
        type="range" min={min} max={max} step={schritt} value={wert}
        onChange={(e) => onChange(Number(e.target.value))}
        className="luni-regler h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-700 accent-teal"
      />
    </label>
  );
}

/** Kiesel wie unten am Haus: Farbe je Kategorie, Nummer und Name immer lesbar. */
function Stein({ eintrag, aktiv, laufend, onClick }: { eintrag: Routine; aktiv: boolean; laufend: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${eintrag.nummer} · ${eintrag.name}${eintrag.hinweis ? ` – ${eintrag.hinweis}` : ""}`}
      className={`group flex w-[100px] flex-col items-center gap-1 rounded-lg p-1.5 ring-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
        aktiv ? "bg-teal/15 ring-teal" : "bg-[#08151a]/60 ring-white/10 hover:bg-[#132a33] hover:ring-white/25"
      }`}
    >
      <span
        className="relative grid h-[30px] w-[52px] place-items-center rounded-[15px] text-[11px] font-bold tabular-nums"
        style={{
          background: `linear-gradient(160deg, ${eintrag.farbe}f2, ${eintrag.farbe}99)`,
          color: "#f7fbf8",
          boxShadow: laufend ? "0 0 0 3px rgba(53,214,192,.6), 0 2px 10px rgba(53,214,192,.4)" : "inset 0 1px 0 rgba(255,255,255,.28)",
        }}
      >
        <span className="absolute left-1.5 text-[11px] leading-none opacity-90">{eintrag.symbol}</span>
        <span className="pl-3.5">{eintrag.nummer}</span>
      </span>
      <span className="line-clamp-2 text-center text-[10px] leading-tight text-mint-200">{eintrag.name}</span>
    </button>
  );
}

export default function RoutinenStudio() {
  /* ------------------------------ Katalog ------------------------------- */
  const [extras, setExtras] = useState<Record<string, string[]>>({});
  const liste = useMemo(() => {
    const alle = basisRoutinen();
    for (const def of PROBE_KETTEN) {
      const gefunden = extras[def.key];
      if (!gefunden?.length) continue;
      const bekannt = new Set(alle.filter((e) => e.ketteKey === def.key).map((e) => e.nummer));
      for (const e of kettenBausteine(def, gefunden)) if (!bekannt.has(e.nummer)) alle.push(e);
    }
    return alle.sort((a, b) => a.nummer - b.nummer);
  }, [extras]);
  const nummern = useMemo(() => new Map(liste.map((e) => [e.nummer, e])), [liste]);
  const bekannt = useMemo(() => new Set(liste.map((e) => e.nummer)), [liste]);
  const kategorien = useMemo(() => routinenKategorien(liste), [liste]);

  /* ------------------------------ Zustand ------------------------------- */
  const [wahl, setWahl] = useState(1007);
  const [ansicht, setAnsicht] = useState<Ansicht>("verfolgt");
  const [tempo, setTempo] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [figurGroesse, setFigurGroesse] = useState(1);
  const [nachfuehrung, setNachfuehrung] = useState(4.5);
  const [rahmen, setRahmen] = useState(false);
  const [schaerfe, setSchaerfe] = useState(0);
  const [wiederholen, setWiederholen] = useState(false);
  const [pause, setPause] = useState(false);
  const [face, setFace] = useState<1 | -1>(1);
  const [ton, setTon] = useState(true);
  const [modus, setModus] = useState<"spiel" | "bau">("spiel");
  const [suche, setSuche] = useState("");
  const [offen, setOffen] = useState<Record<string, boolean>>({ Luni: true });
  const [figur, setFigur] = useState<{ state: LuniState; expr: LuniExpr; dusch: DuschTat | null }>({ state: "wave", expr: "happy", dusch: null });
  const [raum, setRaum] = useState("–");
  const [glieder, setGlieder] = useState<KettenGlied[]>([]);
  const [name, setName] = useState("Morgen-Neu");
  const [gespeichert, setGespeichert] = useState<Gespeichert[]>(() => ladeKetten());
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("Bereit. Klick auf einen Stein spielt genau diese Nummer.");
  const [amLaufen, setAmLaufen] = useState(false);
  const [schritt, setSchritt] = useState(-1);
  const [sekunden, setSekunden] = useState(0);
  const [undo, setUndo] = useState<{ glied: KettenGlied; index: number } | null>(null);

  const probe = useRef<ProbeGriff | null>(null);
  const timer = useRef<number | null>(null);
  const lauf = useRef<{ glieder: KettenGlied[]; i: number; seit: number; pauseRest: number } | null>(null);
  const einzelnSeit = useRef(performance.now());
  const pauseRef = useRef(pause);
  pauseRef.current = pause;

  const eintrag = nummern.get(wahl);
  const reineFigur = (eintrag?.art ?? "figur") === "figur";
  const figurVorschau = ansicht === "figur" && reineFigur;

  const zeigeFigur = useCallback((e: Routine) => {
    setFigur({ state: e.luni ?? "idle", expr: e.mimik ?? "happy", dusch: e.dusch ?? null });
  }, []);

  /* ---------------------------- Ablaufsteuerung -------------------------- */
  const stoppeTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const starteGlied = useCallback((g: KettenGlied, index: number) => {
    const e = nummern.get(g.n);
    if (!e) return;
    setWahl(g.n);
    setSchritt(index);
    setTempo(g.tempo ?? 1);
    setSekunden(0);
    einzelnSeit.current = performance.now();
    if (e.art === "figur") zeigeFigur(e);
    else probe.current?.spiele(e);
    if (lauf.current) lauf.current.seit = performance.now();
    setStatus(`${e.nummer} · ${e.name}`);
  }, [nummern, zeigeFigur]);

  const spieleKette = useCallback((reihe: KettenGlied[], ab = 0) => {
    stoppeTimer();
    if (!reihe.length) {
      setStatus("Die Kette ist leer. Oben auf „+ Kette bauen“ stellen und Steine anklicken.");
      return;
    }
    sfx.ensure();
    setAmLaufen(true);
    setPause(false);
    lauf.current = { glieder: reihe, i: ab, seit: performance.now(), pauseRest: 0 };
    starteGlied(reihe[ab], ab);
    timer.current = window.setInterval(() => {
      const l = lauf.current;
      if (!l) return;
      if (pauseRef.current) {
        l.seit += 150;
        return;
      }
      const g = l.glieder[l.i];
      const e = nummern.get(g.n);
      if (!e) return;
      const dauer = (performance.now() - l.seit) / 1000;
      setSekunden(dauer);
      const faktor = Math.max(0.15, g.tempo ?? 1);
      const meldetEnde = !!(e.ketteKey || e.ereignis);
      const fertig = e.art === "figur" || e.aufwach
        ? dauer >= (e.dauer ?? 4.5) / faktor
        : meldetEnde
          ? (dauer > 1.2 && !(probe.current?.laeuft() ?? false)) || dauer > 12 / faktor
          : dauer >= 8 / faktor;
      if (!fertig) return;
      const wartezeit = g.pause ?? 0;
      if (wartezeit > 0 && l.pauseRest < wartezeit) {
        l.pauseRest += 0.15;
        return;
      }
      l.pauseRest = 0;
      const weiter = l.i + 1;
      if (weiter >= l.glieder.length) {
        stoppeTimer();
        lauf.current = null;
        setAmLaufen(false);
        setSchritt(-1);
        setStatus("Kette fertig. Alle Schritte sind durchgelaufen.");
        return;
      }
      l.i = weiter;
      starteGlied(l.glieder[weiter], weiter);
    }, 150);
  }, [nummern, starteGlied, stoppeTimer]);

  const halt = useCallback(() => {
    stoppeTimer();
    lauf.current = null;
    setAmLaufen(false);
    setSchritt(-1);
    setStatus("Angehalten.");
  }, [stoppeTimer]);

  useEffect(() => () => stoppeTimer(), [stoppeTimer]);

  /* --------------------- Einzelanimation wiederholen --------------------- */
  useEffect(() => {
    const t = window.setInterval(() => {
      if (!wiederholen || amLaufen || pauseRef.current) return;
      const e = nummern.get(wahl);
      if (!e || e.art !== "haus") return;
      const vorbei = (performance.now() - einzelnSeit.current) / 1000;
      if (vorbei < 2.5) return;
      if (probe.current?.laeuft() && vorbei < 14) return;
      probe.current?.spiele(e);
      einzelnSeit.current = performance.now();
    }, 500);
    return () => window.clearInterval(t);
  }, [wiederholen, amLaufen, wahl, nummern]);

  /* ---------------------- Echte Schritte aus dem Haus -------------------- */
  const onBereit = useCallback(() => {
    window.setTimeout(() => {
      const p = probe.current;
      if (!p) return;
      const gefunden: Record<string, string[]> = {};
      for (const def of PROBE_KETTEN) gefunden[def.key] = p.schritte(def.key);
      setExtras(gefunden);
    }, 80);
  }, []);

  /* ------------------------------- Klicks -------------------------------- */
  const steinKlick = useCallback((e: Routine) => {
    sfx.ensure();
    if (modus === "bau") {
      const dazu: KettenGlied[] = e.art === "kette"
        ? (e.kette ?? []).map((n) => ({ n, tempo: 1 }))
        : [{ n: e.nummer, tempo: 1 }];
      setGlieder((k) => [...k, ...dazu].slice(0, 80));
      setWahl(e.nummer);
      setStatus(`${e.nummer} angehängt.`);
      return;
    }
    if (e.art === "kette") {
      const reihe = (e.kette ?? []).map((n) => ({ n, tempo: 1 }));
      setGlieder(reihe);
      spieleKette(reihe);
      return;
    }
    stoppeTimer();
    lauf.current = null;
    setAmLaufen(false);
    setWahl(e.nummer);
    setSchritt(-1);
    setSekunden(0);
    setTempo(1);
    einzelnSeit.current = performance.now();
    if (e.art === "figur") {
      zeigeFigur(e);
      setStatus(`${e.nummer} · ${e.name} – reine Figurenanimation, im Haus maßstäblich eingezeichnet.`);
    } else {
      const ok = probe.current?.spiele(e) ?? false;
      setStatus(ok ? `${e.nummer} · ${e.name} läuft im Probehaus.` : `${e.nummer} · Bühne startet noch, gleich nochmal klicken.`);
    }
  }, [modus, spieleKette, stoppeTimer, zeigeFigur]);

  /* ------------------------------- Kette --------------------------------- */
  function gliedAendern(index: number, teil: Partial<KettenGlied>) {
    setGlieder((k) => k.map((g, i) => (i === index ? { ...g, ...teil } : g)));
  }
  function schieben(index: number, richtung: -1 | 1) {
    setGlieder((k) => {
      const j = index + richtung;
      if (j < 0 || j >= k.length) return k;
      const neu = [...k];
      [neu[index], neu[j]] = [neu[j], neu[index]];
      return neu;
    });
  }
  function loeschen(index: number) {
    setGlieder((k) => {
      const g = k[index];
      if (g) setUndo({ glied: g, index });
      return k.filter((_, i) => i !== index);
    });
  }
  function speichern() {
    if (!glieder.length) {
      setStatus("Nichts zu speichern – die Kette ist leer.");
      return;
    }
    const sauber = name.trim() || "Ohne Namen";
    setGespeichert((alt) => {
      const neu = [...alt.filter((g) => g.name !== sauber), { name: sauber, glieder: [...glieder] }].slice(-30);
      speichereKetten(neu);
      return neu;
    });
    setStatus(`„${sauber}“ gespeichert (${glieder.length} Schritte).`);
  }
  async function kopieren() {
    const text = glieder.length ? ketteKurzcode(name, glieder) : `NUMMER ${wahl}`;
    setCode(text);
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Kurzcode kopiert – hier im Chat einfügen.");
    } catch {
      setStatus("Kurzcode steht im Feld – bitte von Hand kopieren.");
    }
  }
  function exportieren() {
    const blob = new Blob([JSON.stringify({ name, glieder }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kette-${(name.trim() || "luni").replace(/[^\w-]+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Kette als Datei geladen.");
  }
  function uebernehmen() {
    const neu = ketteAusKurzcode(code, bekannt);
    if (!neu.length) {
      setStatus("Im Kurzcode steht keine bekannte Nummer.");
      return;
    }
    setGlieder(neu.slice(0, 80));
    const m = code.match(/KETTE\s*\[(.*?)\]/i);
    if (m?.[1]?.trim()) setName(m[1].trim());
    setStatus(`${neu.length} Schritte aus dem Kurzcode übernommen.`);
  }
  function zuruecksetzen() {
    setZoom(1);
    setFigurGroesse(1);
    setNachfuehrung(4.5);
    setTempo(1);
    setPause(false);
    setRahmen(false);
    setFace(1);
    setStatus("Aktionen zurückgesetzt.");
  }
  function zufall() {
    const e = liste[Math.floor(Math.random() * liste.length)];
    if (e) steinKlick(e);
  }
  const nachbar = useCallback((richtung: -1 | 1) => {
    const i = liste.findIndex((e) => e.nummer === wahl);
    const e = liste[(i + richtung + liste.length) % liste.length];
    if (e) steinKlick(e);
  }, [liste, wahl, steinKlick]);

  /* ------------------------------ Tastatur ------------------------------- */
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const ziel = ev.target as HTMLElement | null;
      if (ziel && ["INPUT", "TEXTAREA", "SELECT"].includes(ziel.tagName)) return;
      if (ev.code === "Space") { ev.preventDefault(); setPause((p) => !p); }
      else if (ev.code === "ArrowRight") { ev.preventDefault(); nachbar(1); }
      else if (ev.code === "ArrowLeft") { ev.preventDefault(); nachbar(-1); }
      else if (ev.code === "Escape") halt();
      else if (ev.code === "Digit1") setAnsicht("figur");
      else if (ev.code === "Digit2") setAnsicht("verfolgt");
      else if (ev.code === "Digit3") setAnsicht("komplett");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nachbar, halt]);

  /* ------------------------------ Anzeige -------------------------------- */
  const treffer = suche.trim()
    ? liste.filter((e) => {
        const s = suche.trim().toLowerCase();
        return e.name.toLowerCase().includes(s) || String(e.nummer).includes(s) || e.unter.toLowerCase().includes(s);
      })
    : null;

  return (
    <div className="bg-room grid-floor min-h-[100dvh] w-full overflow-x-hidden p-3 sm:p-5">
      <div className="mx-auto w-full max-w-[1340px]">
        <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-[8px] tracking-[0.3em] text-teal sm:text-[10px]">
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-coral" />
                LITTLE COMPUTER LUNI · ROUTINEN
              </span>
              <a href="#studio" className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700">← STUDIO</a>
              <a href="#" className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700">ZUM HAUS →</a>
            </div>
            <h1 className="mt-1 font-display text-[22px] leading-none text-mint-50 text-shadow-hard sm:text-[34px]">
              ROUTINEN <span className="text-amber-glow">· KETTEN-BAUKASTEN</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex gap-1 rounded-lg bg-[#08151a]/70 p-1 ring-1 ring-white/10">
              <Knopf aktiv={modus === "spiel"} onClick={() => setModus("spiel")}>Abspielen</Knopf>
              <Knopf aktiv={modus === "bau"} onClick={() => setModus("bau")}>+ Kette bauen</Knopf>
            </div>
            <Knopf aktiv={!ton} onClick={() => { const neu = !ton; setTon(neu); sfx.ensure(); sfx.setMuted(!neu); }} titel="Ton der Probe-Bühne">
              {ton ? "♪ Ton an" : "✕ Ton aus"}
            </Knopf>
          </div>
        </header>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* --------------------- Bühne: fester Platz links --------------------- */}
          <div className="space-y-3">
            <section className="rounded-2xl bg-[#08151a] p-1.5 ring-1 ring-teal/20 sm:p-2">
              {/* Die drei Ansichten über dem Fenster */}
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5 px-1 pt-1">
                <Knopf aktiv={ansicht === "figur"} onClick={() => setAnsicht("figur")} titel="Taste 1">Figurvorschau</Knopf>
                <Knopf aktiv={ansicht === "verfolgt"} onClick={() => setAnsicht("verfolgt")} titel="Taste 2 · nur der betreffende Raum">Haus verf</Knopf>
                <Knopf aktiv={ansicht === "komplett"} onClick={() => setAnsicht("komplett")} titel="Taste 3">Haus kpl</Knopf>
                <span className="ml-auto rounded bg-black/40 px-2 py-1 text-[10px] tabular-nums text-mint-300">
                  {amLaufen ? `Schritt ${schritt + 1}/${lauf.current?.glieder.length ?? glieder.length}` : "einzeln"} · {sekunden.toFixed(1)}s
                </span>
              </div>

              <div className="screen-glass relative w-full overflow-hidden rounded-xl bg-[#050f14]" style={{ aspectRatio: "8 / 5" }}>
                <ProbeBuehne
                  ref={probe}
                  ansicht={ansicht}
                  tempo={tempo}
                  pause={pause}
                  zoom={zoom}
                  figurGroesse={figurGroesse}
                  nachfuehrung={nachfuehrung}
                  rahmen={rahmen}
                  schaerfe={schaerfe}
                  verdeckt={figurVorschau}
                  pose={reineFigur && ansicht !== "figur" ? { state: figur.state, expr: figur.expr, dusch: figur.dusch, face } : null}
                  onBereit={onBereit}
                  onRaum={setRaum}
                />
                {figurVorschau && (
                  <div className="absolute inset-0 bg-[#0a141a]">
                    <LuniStage
                      state={figur.state}
                      expr={figur.expr}
                      face={face}
                      zoom={Math.min(7, (figur.state === "handstand" || figur.state === "cartwheel" || figur.state === "flip" ? 3.4 : 4.2) * figurGroesse)}
                      grid={rahmen}
                      paused={pause}
                      speed={tempo}
                      variant="luni"
                      duschCode={figur.dusch ? DUSCH_CODES[figur.dusch] : null}
                    />
                  </div>
                )}
                <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-[rgba(8,20,26,.88)] px-2 py-1 font-display text-[9px] tracking-[0.18em] text-mint-100">
                  {eintrag ? `${eintrag.nummer} · ${eintrag.name.toUpperCase()}` : "–"}
                </div>
                <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-[rgba(8,20,26,.88)] px-2 py-1 text-[10px] text-mint-300">
                  {figurVorschau ? "Figurvorschau" : ansicht === "komplett" ? "Haus komplett" : `Haus verfolgt · ${raum}`}
                  {pause ? " · Standbild" : ""}{wiederholen ? " · Schleife" : ""}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1 pb-1">
                <Knopf onClick={() => nachbar(-1)}>◀ Stein</Knopf>
                <Knopf onClick={() => { if (eintrag) steinKlick(eintrag); }} titel="Diese Nummer neu starten">↻ Nochmal</Knopf>
                <Knopf onClick={() => nachbar(1)}>Stein ▶</Knopf>
                <Knopf aktiv={pause} onClick={() => setPause((p) => !p)} titel="Leertaste">{pause ? "▶ Weiter" : "⏸ Standbild"}</Knopf>
                <Knopf onClick={halt}>■ Stopp</Knopf>
                <span className="ml-auto min-w-0 flex-1 truncate text-right text-[11px] text-mint-300">{status}</span>
              </div>
            </section>

            {/* ------------------------------ Kette ------------------------------ */}
            <section className="rounded-xl bg-[#0a1c23]/85 p-3 ring-1 ring-white/10">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-[10px] tracking-[0.26em] text-teal">
                  KETTE {glieder.length ? `· ${glieder.length} SCHRITTE` : "· LEER"}
                </h2>
                <span className="text-[10px] text-mint-400/80">Leertaste Standbild · ← → Stein · 1/2/3 Ansicht · Esc Stopp</span>
              </div>

              <div className="min-h-[38px] rounded-lg bg-black/35 p-2 text-[12px] leading-relaxed text-mint-50">
                {glieder.length
                  ? glieder.map((g) => `${g.n}${g.tempo && g.tempo !== 1 ? `@${g.tempo}` : ""}${g.pause ? ` +${g.pause}s` : ""}`).join(" → ")
                  : "Noch leer. „+ Kette bauen“ wählen, dann Steine anklicken – auch ganze 8000er Ketten."}
              </div>

              {glieder.length > 0 && (
                <div className="luni-liste mt-2 max-h-[184px] space-y-1 overflow-y-auto pr-1.5">
                  {glieder.map((g, i) => {
                    const e = nummern.get(g.n);
                    return (
                      <div key={`${g.n}-${i}`} className={`flex flex-wrap items-center gap-1.5 rounded-md px-1.5 py-1 ring-1 ${i === schritt ? "bg-teal/15 ring-teal" : "bg-[#0d2029]/70 ring-white/10"}`}>
                        <span className="w-5 text-right text-[10px] tabular-nums text-mint-400">{i + 1}</span>
                        <button className="rounded bg-[#132a33] px-1.5 py-0.5 text-[11px] tabular-nums text-mint-100 ring-1 ring-white/10 hover:text-teal" onClick={() => { const entry = nummern.get(g.n); if (entry) steinKlick(entry); }}>{g.n}</button>
                        <span className="min-w-0 flex-1 truncate text-[11px] text-mint-200">{e?.name ?? "unbekannt"}</span>
                        <label className="flex items-center gap-1 text-[10px] text-mint-400">
                          Tempo
                          <input type="number" min={0.15} max={3} step={0.05} value={g.tempo ?? 1}
                            onChange={(ev) => gliedAendern(i, { tempo: Math.min(3, Math.max(0.15, Number(ev.target.value) || 1)) })}
                            className="w-14 rounded bg-black/40 px-1 py-0.5 text-[11px] tabular-nums text-mint-100 ring-1 ring-white/10" />
                        </label>
                        <label className="flex items-center gap-1 text-[10px] text-mint-400">
                          Pause
                          <input type="number" min={0} max={30} step={0.5} value={g.pause ?? 0}
                            onChange={(ev) => gliedAendern(i, { pause: Math.min(30, Math.max(0, Number(ev.target.value) || 0)) })}
                            className="w-14 rounded bg-black/40 px-1 py-0.5 text-[11px] tabular-nums text-mint-100 ring-1 ring-white/10" />
                        </label>
                        <button className="px-1 text-mint-300 hover:text-teal" onClick={() => schieben(i, -1)} aria-label="nach oben">▲</button>
                        <button className="px-1 text-mint-300 hover:text-teal" onClick={() => schieben(i, 1)} aria-label="nach unten">▼</button>
                        <button className="px-1 text-mint-300 hover:text-coral" onClick={() => loeschen(i)} aria-label="Baustein löschen">×</button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Knopf onClick={() => spieleKette(glieder)}>▶ Kette abspielen</Knopf>
                <Knopf onClick={() => { const i = Math.max(0, schritt); if (glieder[i]) spieleKette(glieder, i); }}>Ab Schritt {Math.max(1, schritt + 1)}</Knopf>
                <Knopf onClick={() => setSchritt((s) => Math.max(0, s - 1))}>◀</Knopf>
                <Knopf onClick={() => setSchritt((s) => Math.min(Math.max(0, glieder.length - 1), s + 1))}>▶</Knopf>
                <Knopf onClick={() => { halt(); setGlieder([]); }}>Leeren</Knopf>
                {undo && (
                  <Knopf onClick={() => { setGlieder((k) => { const neu = [...k]; neu.splice(Math.min(undo.index, neu.length), 0, undo.glied); return neu; }); setUndo(null); setStatus("Baustein zurückgeholt."); }}>
                    ↩ Löschen rückgängig
                  </Knopf>
                )}
              </div>

              <div className="mt-2 grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="flex items-center gap-2 text-[11px] text-mint-400">
                  Name
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
                    className="min-w-0 flex-1 rounded-md bg-black/40 px-2 py-1.5 text-[12px] text-mint-50 ring-1 ring-white/10" />
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <Knopf onClick={speichern}>Lokal speichern</Knopf>
                  <Knopf onClick={kopieren}>Kurzcode kopieren</Knopf>
                  <Knopf onClick={exportieren}>Als Datei</Knopf>
                </div>
              </div>

              <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={2}
                placeholder="KETTE [Morgen-Neu]: 2301 > 2104@0.5 > +2s > 2256"
                className="mt-1.5 w-full rounded-md bg-black/40 px-2 py-1.5 text-[11px] text-mint-200 ring-1 ring-white/10" />
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Knopf onClick={uebernehmen}>Kurzcode übernehmen</Knopf>
              </div>

              {gespeichert.length > 0 && (
                <div className="mt-2 border-t border-white/10 pt-2">
                  <div className="mb-1 font-display text-[10px] tracking-[0.22em] text-teal">9000er · GESPEICHERT</div>
                  <div className="flex flex-wrap gap-1.5">
                    {gespeichert.map((g) => (
                      <span key={g.name} className="flex items-center gap-1 rounded-md bg-[#132a33] py-1 pl-2 pr-1 text-[11px] text-mint-200 ring-1 ring-white/10">
                        <button className="hover:text-mint-50" onClick={() => { setGlieder(g.glieder.map((x) => ({ ...x }))); setName(g.name); setStatus(`„${g.name}“ geladen.`); }}>{g.name} · {g.glieder.length}</button>
                        <button className="px-1 hover:text-teal" aria-label={`${g.name} abspielen`} onClick={() => { setGlieder(g.glieder.map((x) => ({ ...x }))); setName(g.name); spieleKette(g.glieder); }}>▶</button>
                        <button className="px-1 hover:text-coral" aria-label={`${g.name} löschen`} onClick={() => setGespeichert((alt) => { const neu = alt.filter((x) => x.name !== g.name); speichereKetten(neu); return neu; })}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ------------- Rechts: Aufklappmenüs, darunter die Aktionen ------------- */}
          <div className="space-y-3">
            <section className="rounded-xl bg-[#0a1c23]/85 p-3 ring-1 ring-white/10">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-[10px] tracking-[0.26em] text-teal">AUSWAHL · {liste.length} BAUSTEINE</h2>
                <span className="text-[10px] text-mint-400/80">{modus === "spiel" ? "Klick = abspielen" : "Klick = anhängen"}</span>
              </div>
              <input value={suche} onChange={(e) => setSuche(e.target.value)}
                placeholder="Suchen: Name oder Nummer – z. B. Socken, Wurf, 2256"
                className="mb-2 w-full rounded-md bg-black/40 px-2 py-1.5 text-[12px] text-mint-50 ring-1 ring-white/10 placeholder:text-mint-400/50" />

              <div className="luni-liste max-h-[46vh] min-h-[220px] space-y-1.5 overflow-y-auto pr-1.5 xl:max-h-[52vh]">
                {treffer ? (
                  treffer.length ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {treffer.map((e) => <Stein key={e.nummer} eintrag={e} aktiv={e.nummer === wahl} laufend={glieder[schritt]?.n === e.nummer} onClick={() => steinKlick(e)} />)}
                    </div>
                  ) : (
                    <p className="pt-2 text-[12px] text-mint-300">Nichts gefunden. Andere Nummer oder kürzeres Wort versuchen.</p>
                  )
                ) : (
                  kategorien.map((g) => {
                    const auf = !!offen[g.kategorie];
                    const unter = Object.entries(g.eintraege.reduce<Record<string, Routine[]>>((m, e) => {
                      (m[e.unter] = m[e.unter] ?? []).push(e);
                      return m;
                    }, {}));
                    const farbe = g.eintraege[0]?.farbe ?? "#2f6f6a";
                    return (
                      <div key={g.kategorie} className="overflow-hidden rounded-lg bg-[#08151a]/70 ring-1 ring-white/10">
                        <button
                          className="flex w-full items-center gap-2 px-2 py-2 text-left transition hover:bg-[#132a33]"
                          aria-expanded={auf}
                          onClick={() => setOffen((z) => ({ ...z, [g.kategorie]: !z[g.kategorie] }))}
                        >
                          <span className="h-4 w-1.5 rounded-full" style={{ background: farbe }} />
                          <span className="text-[11px] text-teal">{auf ? "▾" : "▸"}</span>
                          <span className="font-display text-[10px] uppercase tracking-[0.2em] text-mint-200">{g.kategorie}</span>
                          <span className="ml-auto rounded bg-black/40 px-1.5 py-0.5 text-[10px] tabular-nums text-mint-400">{g.eintraege.length}</span>
                        </button>
                        {auf && (
                          <div className="space-y-2 border-t border-white/10 px-2 pb-2 pt-2">
                            {unter.map(([u, eintraege]) => (
                              <div key={u}>
                                <div className="mb-1 text-[10px] uppercase tracking-[0.14em] text-mint-400/80">{u}</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {eintraege.map((e) => <Stein key={e.nummer} eintrag={e} aktiv={e.nummer === wahl} laufend={glieder[schritt]?.n === e.nummer} onClick={() => steinKlick(e)} />)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Aktionen für die gewählte Animation – immer sichtbar, wirken sofort */}
            <section className="rounded-xl bg-[#0a1c23]/85 p-3 ring-1 ring-white/10">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-[10px] tracking-[0.26em] text-teal">AKTIONEN</h2>
                <span className="text-[10px] tabular-nums text-mint-400/80">{eintrag ? `Nr. ${eintrag.nummer}` : "–"}</span>
              </div>
              {eintrag && (
                <p className="mb-2 rounded-md bg-black/30 px-2 py-1.5 text-[11px] leading-relaxed text-mint-200">
                  <strong className="text-mint-50">{eintrag.name}</strong> · {eintrag.kategorie} / {eintrag.unter}
                  {eintrag.hinweis ? ` – ${eintrag.hinweis}` : ""}
                  {eintrag.kette ? ` – Kette: ${eintrag.kette.join(" → ")}` : ""}
                </p>
              )}
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Regler titel="Schneller / langsamer" wert={tempo} min={0.15} max={3} schritt={0.05} onChange={(v) => { setTempo(v); if (schritt >= 0) gliedAendern(schritt, { tempo: v }); }} />
                <Regler titel="Zoom (Kamera)" wert={zoom} min={0.6} max={2.6} schritt={0.05} onChange={setZoom} />
                <Regler titel="Figur größer" wert={figurGroesse} min={0.6} max={2.2} schritt={0.05} onChange={setFigurGroesse} />
                <Regler titel="Kamera-Nachführung" wert={nachfuehrung} min={1} max={12} schritt={0.5} einheit="" onChange={setNachfuehrung} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Knopf aktiv={face === -1} onClick={() => setFace((f) => (f === 1 ? -1 : 1))}>↔ Blick {face === 1 ? "rechts" : "links"}</Knopf>
                <Knopf aktiv={wiederholen} onClick={() => setWiederholen((w) => !w)}>↻ Wiederholen</Knopf>
                <Knopf aktiv={rahmen} onClick={() => setRahmen((r) => !r)}># Rahmen</Knopf>
                <label className="flex min-h-8 items-center gap-1.5 rounded-md bg-[#132a33] px-2 py-1 text-[11px] text-mint-200 ring-1 ring-white/10">
                  Schärfe
                  <select
                    value={schaerfe}
                    onChange={(e) => setSchaerfe(Number(e.target.value))}
                    className="rounded bg-black/50 px-1 py-0.5 text-[11px] text-mint-100 ring-1 ring-white/10"
                  >
                    <option value={0}>auto</option>
                    <option value={1}>1×</option>
                    <option value={2}>2×</option>
                    <option value={3}>3×</option>
                    <option value={4}>4×</option>
                  </select>
                </label>
                <Knopf aktiv={pause} onClick={() => setPause((p) => !p)}>⏸ Standbild</Knopf>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
                <Knopf onClick={() => { if (eintrag) steinKlick(eintrag); }}>▶ Animation starten</Knopf>
                <Knopf onClick={zufall}>⚄ Zufall</Knopf>
                <Knopf onClick={zuruecksetzen}>⟲ Zurücksetzen</Knopf>
                <Knopf onClick={kopieren}>⧉ Kurzcode</Knopf>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
