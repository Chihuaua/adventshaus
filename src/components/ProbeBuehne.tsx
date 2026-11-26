import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { House, W as HAUS_B, H as HAUS_H } from "@/game/house";
import { drawLuni, type LuniExpr, type LuniState } from "@/game/luni";
import { DUSCH_CODES, augenZu, type DuschTat } from "@/game/duschprogramm";
import type { Routine } from "@/game/routinen";

/** Die drei Ansichten über dem Fenster. */
export type Ansicht = "figur" | "verfolgt" | "komplett";

/** Reine Figurenpose, die im Haus mitgezeichnet wird (z. B. Moonwalk in der Küche). */
export interface PosenWahl {
  state: LuniState;
  expr: LuniExpr;
  dusch: DuschTat | null;
  face: 1 | -1;
}

export interface ProbeEinstellungen {
  ansicht: Ansicht;
  tempo: number;
  pause: boolean;
  zoom: number;
  figurGroesse: number;
  nachfuehrung: number;
  rahmen: boolean;
  /** 0 = automatisch an die Bildrate anpassen, 1..4 feste Schärfestufe. */
  schaerfe: number;
  /** Nur gesetzt, wenn die gewählte Nummer eine reine Figurenanimation ist. */
  pose: PosenWahl | null;
  /** Figur-Vorschau liegt über der Bühne: Hauszeichenfläche ausblenden. */
  verdeckt: boolean;
}

export interface ProbeGriff {
  spiele(eintrag: Routine): boolean;
  schritte(key: string): string[];
  laeuft(): boolean;
  raum(): string;
  bereit(): boolean;
}

interface Props extends ProbeEinstellungen {
  onBereit?: () => void;
  onRaum?: (name: string) => void;
}

/** Maßstab der Figur im Haus (house.ts: LUNI_SCALE). */
const HAUS_FIGUR = 1.08;

/** Trennt die Probe vom echten Spielstand – Welten, Advent, Besuche und Wetter bleiben flüchtig. */
function probeSpeicher(): { zurueck: () => void; aufraeumen: () => void } {
  const echt = window.localStorage;
  const fluechtig = new Map<string, string>();
  const muster = /^(lcp1\.welt\.|lcp1\.advent\.|lcp1\.besuch\.|lcp1\.wetter\.)/;
  const vorher = new Map<string, string>();
  for (let i = 0; i < echt.length; i++) {
    const k = echt.key(i);
    if (k && muster.test(k)) {
      const v = echt.getItem(k);
      if (v !== null) vorher.set(k, v);
    }
  }
  const betroffen = (k: string) => muster.test(k);
  const proto = Object.getPrototypeOf(echt) as Storage;
  const original = { get: proto.getItem, set: proto.setItem, del: proto.removeItem };
  proto.getItem = function (k: string) {
    return betroffen(k) ? fluechtig.get(k) ?? null : original.get.call(this, k);
  };
  proto.setItem = function (k: string, v: string) {
    if (betroffen(k)) fluechtig.set(k, String(v));
    else original.set.call(this, k, v);
  };
  proto.removeItem = function (k: string) {
    if (betroffen(k)) fluechtig.delete(k);
    else original.del.call(this, k);
  };
  const aufraeumen = () => {
    const weg: string[] = [];
    for (let i = 0; i < echt.length; i++) {
      const k = echt.key(i);
      if (k && muster.test(k)) weg.push(k);
    }
    for (const k of weg) {
      const alt = vorher.get(k);
      if (alt === undefined) original.del.call(echt, k);
      else if (original.get.call(echt, k) !== alt) original.set.call(echt, k, alt);
    }
  };
  return {
    aufraeumen,
    zurueck: () => {
      proto.getItem = original.get;
      proto.setItem = original.set;
      proto.removeItem = original.del;
      aufraeumen();
    },
  };
}

interface Rechteck { x: number; y: number; b: number; h: number }

/** Ausschnitt auf 8:5 bringen und in der Bühne halten. */
function passeAn(r: Rechteck): Rechteck {
  const seite = HAUS_B / HAUS_H;
  let b = Math.max(60, r.b);
  let h = Math.max(38, r.h);
  if (b / h < seite) b = h * seite;
  else h = b / seite;
  if (b > HAUS_B) { b = HAUS_B; h = HAUS_H; }
  if (h > HAUS_H) { h = HAUS_H; b = HAUS_B; }
  const x = Math.min(Math.max(0, r.x + r.b / 2 - b / 2), HAUS_B - b);
  const y = Math.min(Math.max(0, r.y + r.h / 2 - h / 2), HAUS_H - h);
  return { x, y, b, h };
}

/**
 * Eine Bühne, ein Bild: Das Haus zeichnet in einen festen 960×600-Puffer, die
 * sichtbare Fläche ist genau ein Ausschnitt daraus. In der Verfolgung ist nur
 * der betreffende Raum zu sehen; reine Figurenposen werden maßstäblich in den
 * Raum gezeichnet, statt als zweite Bühne darübergelegt.
 */
export const ProbeBuehne = forwardRef<ProbeGriff, Props>(function ProbeBuehne(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hausRef = useRef<House | null>(null);
  const wahl = useRef<Props>(props);
  wahl.current = props;
  const ausschnitt = useRef<Rechteck>({ x: 0, y: 0, b: HAUS_B, h: HAUS_H });
  const zeit = useRef({ t: 0, walk: 0, phase: 0, raum: "" });

  useEffect(() => {
    const host = hostRef.current;
    const ziel = canvasRef.current;
    if (!host || !ziel) return;
    const wacht = probeSpeicher();
    const quelle = document.createElement("canvas");
    quelle.style.width = `${HAUS_B}px`;
    quelle.style.height = `${HAUS_H}px`;
    host.appendChild(quelle);
    let haus: House;
    try {
      haus = new House(quelle, { welt: "normal" });
      haus.mount();
    } catch {
      wacht.zurueck();
      return;
    }
    hausRef.current = haus;
    wahl.current.onBereit?.();

    const ctx = ziel.getContext("2d");
    let raf = 0;
    let zuletzt = performance.now();
    let breite = 0;
    let hoehe = 0;
    let wachsatz = 0;
    let pufferStufe = 0;
    let hoechstStufe = 3;
    let letzteAenderung = 0;
    const zeiten: number[] = [];
    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    /**
     * Der Hauspuffer wird so fein gerechnet, dass der gezeigte Ausschnitt nicht
     * hochskaliert werden muss – sonst wirkt das Haus bei Zoom matschig.
     * Stufen mit festem Speicherbudget, Nachschärfen nur bei echtem Bedarf.
     */
    const schaerfe = (ausschnittBreite: number, schnitt: number, jetzt: number) => {
      const schirm = dpr();
      const klein = window.innerWidth < 900;
      const stufen = klein ? [1280, 1600, 1920, 2240] : [1600, 2240, 2880, 3200];
      const fest = wahl.current.schaerfe;
      // Selbstregelung: wird es ruckelig, geht die Auflösung eine Stufe herunter.
      if (fest === 0 && jetzt - letzteAenderung > 1200 && zeiten.length > 20) {
        if (schnitt > 30 && hoechstStufe > 0) { hoechstStufe--; letzteAenderung = jetzt; }
        else if (schnitt < 15 && hoechstStufe < stufen.length - 1) { hoechstStufe++; letzteAenderung = jetzt; }
      }
      const noetig = (breite * schirm) / Math.max(0.08, ausschnittBreite / HAUS_B);
      let index = 0;
      for (let i = 0; i < stufen.length; i++) if (noetig > stufen[i] * 0.92) index = i;
      if (fest > 0) index = Math.min(stufen.length - 1, fest - 1);
      else index = Math.min(index, hoechstStufe);
      const stufe = stufen[index];
      if (stufe === pufferStufe) return;
      pufferStufe = stufe;
      const cssBreite = stufe / Math.max(1, schirm);
      host.style.width = `${cssBreite}px`;
      host.style.height = `${(cssBreite * HAUS_H) / HAUS_B}px`;
    };
    const anpassen = () => {
      const eltern = ziel.parentElement;
      if (!eltern) return;
      breite = Math.max(1, eltern.clientWidth);
      hoehe = Math.max(1, eltern.clientHeight);
      const d = dpr();
      ziel.width = Math.round(breite * d);
      ziel.height = Math.round(hoehe * d);
      ziel.style.width = `${breite}px`;
      ziel.style.height = `${hoehe}px`;
    };
    anpassen();
    const ro = new ResizeObserver(anpassen);
    if (ziel.parentElement) ro.observe(ziel.parentElement);

    const frame = (jetzt: number) => {
      raf = requestAnimationFrame(frame);
      const roh = jetzt - zuletzt;
      const dt = Math.min(0.05, roh / 1000);
      zuletzt = jetzt;
      zeiten.push(roh);
      if (zeiten.length > 45) zeiten.shift();
      const schnitt = zeiten.reduce((a, b) => a + b, 0) / Math.max(1, zeiten.length);
      const h = hausRef.current;
      if (!h || !ctx || breite < 2) return;
      const o = wahl.current;
      if (++wachsatz % 90 === 0) wacht.aufraeumen();
      const faktor = o.pause ? 0 : o.tempo;
      h.probeTempo = faktor;
      // Eine Figur, nicht zwei: Bei aufgelegter Pose malt das Haus Luni nicht selbst.
      h.probeFigurAus = !!o.pose;
      if (o.pose?.dusch) h.probeDusche = true;
      zeit.current.t += dt * faktor;
      const pose = o.pose;
      if (pose) {
        if (pose.state === "walk") zeit.current.walk += dt * faktor * 7.2;
        else if (pose.state === "run") zeit.current.walk += dt * faktor * 12;
        else zeit.current.walk += dt * faktor * 2;
        zeit.current.phase = (zeit.current.phase + (dt * faktor) / 1.2) % 1;
      }

      const k = h.probeKamera;
      const raum = h.probeRaum;
      if (raum.name !== zeit.current.raum) {
        zeit.current.raum = raum.name;
        o.onRaum?.(raum.name);
      }
      const zoom = Math.max(0.5, o.zoom);
      let zielR: Rechteck;
      if (o.verdeckt) {
        // Figur-Vorschau liegt oben: Kamera ruhig halten, aber mitziehen.
        zielR = passeAn({ x: k.x - 110, y: k.y - 150, b: 220, h: 170 });
      } else if (o.ansicht === "komplett") {
        const b = HAUS_B / zoom;
        const hh = HAUS_H / zoom;
        zielR = passeAn({ x: k.x - b / 2, y: k.y - hh / 2 - 40, b, h: hh });
        if (zoom <= 1.001) zielR = { x: 0, y: 0, b: HAUS_B, h: HAUS_H };
      } else if (o.ansicht === "verfolgt") {
        // Genau der Raum, in dem sie gerade steht – Nachbarräume bleiben draußen.
        const rx = raum.x0 - 8;
        const ry = raum.y0 - 2;
        const rb = raum.x1 - raum.x0 + 16;
        const rh = raum.y1 - raum.y0 + 4;
        const b = rb / zoom;
        const hh = rh / zoom;
        const mx = Math.min(Math.max(k.x, rx + b / 2), rx + rb - b / 2);
        const my = Math.min(Math.max(k.y - rh * 0.28, ry + hh / 2), ry + rh - hh / 2);
        zielR = passeAn({ x: mx - b / 2, y: my - hh / 2, b, h: hh });
        // Nie über den Raumrand hinauswandern.
        const rahmen = passeAn({ x: rx, y: ry, b: rb, h: rh });
        zielR.x = Math.min(Math.max(zielR.x, rahmen.x), rahmen.x + rahmen.b - zielR.b);
        zielR.y = Math.min(Math.max(zielR.y, rahmen.y), rahmen.y + rahmen.h - zielR.h);
      } else {
        const b = HAUS_B / (4.4 * zoom);
        const hh = HAUS_H / (4.4 * zoom);
        zielR = passeAn({ x: k.x - b / 2, y: k.y - 30 - hh / 2, b, h: hh });
      }

      const glatt = 1 - Math.exp(-dt * Math.max(0.5, o.nachfuehrung));
      const a = ausschnitt.current;
      a.x += (zielR.x - a.x) * glatt;
      a.y += (zielR.y - a.y) * glatt;
      a.b += (zielR.b - a.b) * glatt;
      a.h += (zielR.h - a.h) * glatt;

      const d = dpr();
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.fillStyle = "#050f14";
      ctx.fillRect(0, 0, breite, hoehe);
      if (o.verdeckt) return;
      schaerfe(a.b, schnitt, jetzt);
      const px = quelle.width / HAUS_B;
      const py = quelle.height / HAUS_H;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(quelle, a.x * px, a.y * py, a.b * px, a.h * py, 0, 0, breite, hoehe);

      // Reine Figurenanimation maßstäblich in den Raum setzen.
      if (pose) {
        const mass = (breite / a.b) * HAUS_FIGUR * o.figurGroesse;
        const sx = ((k.x - a.x) / a.b) * breite;
        const sy = ((k.y - a.y) / a.h) * hoehe;
        const duschPhase = pose.dusch !== null
          ? DUSCH_CODES[pose.dusch] + ((zeit.current.t % 3.6) / 3.6)
          : 0;
        ctx.save();
        drawLuni(ctx, sx, sy, {
          t: zeit.current.t,
          face: pose.face,
          state: pose.dusch !== null ? "wash" : pose.state,
          expr: pose.dusch !== null ? (augenZu(duschPhase) ? "sleep" : "happy") : pose.expr,
          walk: zeit.current.walk,
          phase: pose.dusch !== null ? duschPhase : zeit.current.phase,
          scale: mass,
          shadow: true,
          ...(pose.dusch !== null ? { outfit: "towel" as const, socken: false, wet: 1, glasses: false } : {}),
        });
        ctx.restore();
      }

      if (o.rahmen) {
        ctx.save();
        ctx.strokeStyle = "rgba(53,214,192,.55)";
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(8.5, 8.5, breite - 17, hoehe - 17);
        ctx.setLineDash([]);
        ctx.strokeStyle = "rgba(255,182,72,.5)";
        ctx.beginPath();
        ctx.moveTo(breite / 2, hoehe / 2 - 12);
        ctx.lineTo(breite / 2, hoehe / 2 + 12);
        ctx.moveTo(breite / 2 - 12, hoehe / 2);
        ctx.lineTo(breite / 2 + 12, hoehe / 2);
        ctx.stroke();
        ctx.restore();
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      hausRef.current = null;
      try {
        haus.destroy();
      } catch {
        /* Bühne ist schon weg */
      }
      quelle.remove();
      wacht.zurueck();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, (): ProbeGriff => ({
    bereit: () => hausRef.current !== null,
    laeuft: () => hausRef.current?.probeLaeuft ?? false,
    raum: () => hausRef.current?.probeRaum.name ?? "–",
    schritte: (key) => hausRef.current?.probeSchritte(key) ?? [],
    spiele: (eintrag) => {
      const h = hausRef.current;
      if (!h) return false;
      if (eintrag.ketteKey && eintrag.schritt) return h.probeSchritt(eintrag.ketteKey, eintrag.schritt);
      if (eintrag.aufwach) return h.probeAufwach(eintrag.aufwach);
      if (eintrag.ereignis) return h.probeEreignis(eintrag.ereignis);
      if (eintrag.befehl) {
        h.command(eintrag.befehl);
        return true;
      }
      return false;
    },
  }), []);

  return (
    <>
      <div ref={hostRef} aria-hidden className="pointer-events-none absolute left-[-10000px] top-0 h-[600px] w-[960px] overflow-hidden opacity-0" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ visibility: props.verdeckt ? "hidden" : "visible" }}
      />
    </>
  );
});
