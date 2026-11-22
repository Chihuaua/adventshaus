import { useEffect, useRef } from "react";
import { drawLuni, type LuniExpr, type LuniState } from "@/game/luni";
import { drawMethanFrog, type MethanPose, type FroschEditor } from "@/game/lieferfrosch";
import {
  EDITOR_GLENKE,
  EDITOR_GLENK_LABEL,
  figurenPunkte,
  type EditorDelta,
  type EditorFigur,
  type EditorGelenk,
} from "@/game/editor";

interface Props {
  figur: EditorFigur;
  pose: string;
  expr: LuniExpr;
  zoom: number;
  grid: boolean;
  paused: boolean;
  speed: number;
  /** Bereits übernommene Deltas (werden angezeigt und sind Ausgangslage). */
  uebernommen: EditorDelta;
  /** during drag / Tastatur laufende Änderung */
  delta: EditorDelta;
  onDelta: (d: EditorDelta) => void;
  onGelenk: (g: EditorGelenk) => void;
  gelenk: EditorGelenk | null;
}

const GRIFF_R = 7;

/** Editor-Bühne: Figur groß, Gelenkpunkte greifbar, Maus + Tastatur + Durchschalten. */
export function EditorStage({
  figur,
  pose,
  expr,
  zoom,
  grid,
  paused,
  speed,
  uebernommen,
  delta,
  onDelta,
  onGelenk,
  gelenk,
}: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const p = useRef({ figur, pose, expr, zoom, grid, paused, speed, uebernommen, delta, onDelta, gelenk, onGelenk });
  p.current = { figur, pose, expr, zoom, grid, paused, speed, uebernommen, delta, onDelta, gelenk, onGelenk };


  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let walk = 0;
    let blinkT = 2;
    let blink = 0;
    let last = performance.now();
    let drag: { g: EditorGelenk; startX: number; startY: number; orig: [number, number] } | null = null;
    let hover: EditorGelenk | null = null;

    const resize = () => {
      const parent = cv.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (cv.parentElement) ro.observe(cv.parentElement);

    // Bildschirm -> Figurenraum
    const toFig = (cx: number, cy: number) => {
      const o = p.current;
      const w = cv.width / Math.min(window.devicePixelRatio || 1, 2);
      const h = cv.height / Math.min(window.devicePixelRatio || 1, 2);
      const groundY = h * 0.82;
      const sc = o.zoom;
      return { x: (cx - w / 2) / sc, y: (cy - groundY) / sc, groundY, sc, w, h };
    };

    const punktAt = (cx: number, cy: number): EditorGelenk | null => {
      const o = p.current;
      const f = toFig(cx, cy);
      const pkt = figurenPunkte(o.figur, o.pose, 0, 0);
      let best: EditorGelenk | null = null;
      let bestD = GRIFF_R / f.sc + 2;
      for (const g of EDITOR_GLENKE) {
        const d = o.delta[g] ?? [0, 0];
        const px = pkt[g][0] + d[0];
        const py = pkt[g][1] + d[1];
        const dist = Math.hypot(px - f.x, py - f.y);
        if (dist < bestD) {
          bestD = dist;
          best = g;
        }
      }
      return best;
    };

    const down = (e: PointerEvent) => {
      const rect = cv.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const g = punktAt(cx, cy);
      if (!g) return;
      const o = p.current;
      const pkt = figurenPunkte(o.figur, o.pose, 0, 0);
      const d = o.delta[g] ?? [0, 0];
      drag = { g, startX: cx, startY: cy, orig: [pkt[g][0] + d[0], pkt[g][1] + d[1]] };
      o.onGelenk(g);
      cv.setPointerCapture(e.pointerId);
      cv.style.cursor = "grabbing";
      e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      const rect = cv.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      if (drag) {
        const o = p.current;
        const f = toFig(cx, cy);
        const d = o.delta[drag.g] ?? [0, 0];
        const pkt = figurenPunkte(o.figur, o.pose, 0, 0);
        const zielX = drag.orig[0] + (cx - drag.startX) / f.sc;
        const zielY = drag.orig[1] + (cy - drag.startY) / f.sc;
        const dx = zielX - pkt[drag.g][0];
        const dy = zielY - pkt[drag.g][1];
        o.onDelta({ ...o.delta, [drag.g]: [Math.round(dx * 10) / 10, Math.round(dy * 10) / 10] });
        void d;
        return;
      }
      const g = punktAt(cx, cy);
      hover = g;
      cv.style.cursor = g ? "grab" : "default";
    };
    const up = (e: PointerEvent) => {
      if (!drag) return;
      drag = null;
      cv.style.cursor = "default";
      try {
        cv.releasePointerCapture(e.pointerId);
      } catch {
        /* Pointer bereits freigegeben */
      }
    };
    const key = (e: KeyboardEvent) => {
      const o = p.current;
      const ziel = e.target as HTMLElement | null;
      if (ziel && (ziel.tagName === "INPUT" || ziel.tagName === "TEXTAREA" || ziel.tagName === "SELECT")) return;
      if (e.key === "Tab") return; // natives Durchschalten bleibt
      if (o.gelenk === null) return;
      const schritt = e.shiftKey ? 0.5 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === "ArrowLeft") dx = -schritt;
      else if (e.key === "ArrowRight") dx = schritt;
      else if (e.key === "ArrowUp") dy = -schritt;
      else if (e.key === "ArrowDown") dy = schritt;
      else if (e.key === "Delete" || e.key === "Backspace") {
        const n = { ...o.delta };
        delete n[o.gelenk];
        o.onDelta(n);
        e.preventDefault();
        return;
      } else return;
      const alt = o.delta[o.gelenk] ?? [0, 0];
      o.onDelta({ ...o.delta, [o.gelenk]: [Math.round((alt[0] + dx) * 10) / 10, Math.round((alt[1] + dy) * 10) / 10] });
      e.preventDefault();
    };
    cv.addEventListener("pointerdown", down);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    cv.addEventListener("pointerleave", () => {
      hover = null;
      if (!drag) cv.style.cursor = "default";
    });
    window.addEventListener("keydown", key);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const real = Math.min(0.05, (now - last) / 1000);
      last = now;
      const o = p.current;
      const dt = o.paused ? 0 : real * o.speed;
      t += dt;
      if (o.figur === "frosch" ? ["walk", "walkCarry", "run"].includes(o.pose) : o.pose === "walk") walk += dt * (o.figur === "frosch" ? 5.0 : 7.2);
      blinkT -= dt;
      if (blinkT <= 0) {
        blinkT = 2 + Math.random() * 3.5;
        blink = 0.14;
      }
      blink = Math.max(0, blink - dt);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.width / dpr;
      const h = cv.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#101c22");
      g.addColorStop(1, "#0a141a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const groundY = h * 0.82;
      const sc = o.zoom;

      if (o.grid) {
        ctx.save();
        ctx.strokeStyle = "rgba(120,220,205,.09)";
        ctx.lineWidth = 1;
        for (let gy = groundY; gy > 0; gy -= 10 * sc) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(w, gy);
          ctx.stroke();
        }
        for (let gx = w / 2; gx < w; gx += 10 * sc) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, groundY);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(w - gx, 0);
          ctx.lineTo(w - gx, groundY);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.fillStyle = "#1a3038";
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = "rgba(255,255,255,.07)";
      ctx.fillRect(0, groundY, w, 2);

      // Übernommene Position als schwache Geisterfigur
      const hatUeber = Object.values(o.uebernommen).some((v) => v);
      if (hatUeber) {
        ctx.save();
        ctx.globalAlpha = 0.22;
        zeichne(ctx, o.figur, w / 2, groundY, o.pose, o.expr, t, walk, blink, sc, o.uebernommen);
        ctx.restore();
      }
      // Aktuell
      zeichne(ctx, o.figur, w / 2, groundY, o.pose, o.expr, t, walk, blink, sc, o.delta);

      // Griffe
      const pkt = figurenPunkte(o.figur, o.pose, t, walk);
      for (const gj of EDITOR_GLENKE) {
        const d = o.delta[gj] ?? [0, 0];
        const px = w / 2 + (pkt[gj][0] + d[0]) * sc;
        const py = groundY + (pkt[gj][1] + d[1]) * sc;
        const aktiv = o.gelenk === gj;
        const istHover = hover === gj;
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, aktiv ? GRIFF_R + 3 : GRIFF_R, 0, Math.PI * 2);
        if (aktiv) {
          ctx.strokeStyle = "#35d6c0";
          ctx.lineWidth = 2.5;
          ctx.stroke(); // sichtbarer Fokus-Ring
        }
        ctx.beginPath();
        ctx.arc(px, py, GRIFF_R - 1, 0, Math.PI * 2);
        ctx.fillStyle = gj === "head" ? "#ffd166" : gj.startsWith("hand") ? "#35d6c0" : gj.startsWith("foot") ? "#ff6f61" : "#eef7f2";
        ctx.globalAlpha = istHover || aktiv ? 1 : 0.82;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#04211d";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if ((aktiv || istHover) && d) {
          ctx.font = '600 11px "Space Grotesk", sans-serif';
          const label = `${EDITOR_GLENK_LABEL[gj]}  ${d[0] >= 0 ? "+" : ""}${d[0]} / ${d[1] >= 0 ? "+" : ""}${d[1]}`;
          const tw = ctx.measureText(label).width;
          const bx = Math.min(w - tw - 16, Math.max(4, px + 12));
          const by = Math.max(4, py - 28);
          ctx.fillStyle = "rgba(8,20,26,.88)";
          ctx.beginPath();
          ctx.roundRect(bx, by, tw + 16, 20, 5);
          ctx.fill();
          ctx.fillStyle = "#eef7f2";
          ctx.fillText(label, bx + 8, by + 14);
        }
        ctx.restore();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener("pointerdown", down);
      cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerup", up);
      cv.removeEventListener("pointercancel", up);
      window.removeEventListener("keydown", key);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 touch-none"
      tabIndex={0}
      aria-label="Editor-Bühne: Gelenkpunkte ziehen"
    />
  );
}

function zeichne(
  ctx: CanvasRenderingContext2D,
  figur: EditorFigur,
  x: number,
  y: number,
  pose: string,
  expr: LuniExpr,
  t: number,
  walk: number,
  blink: number,
  sc: number,
  delta: EditorDelta,
) {
  if (figur === "frosch") {
    drawMethanFrog(ctx, x, y, {
      t,
      pose: pose as MethanPose,
      expr: exprToFrosch(expr),
      walk,
      blink,
      scale: sc,
      edit: delta as FroschEditor,
    });
  } else {
    drawLuni(ctx, x, y, {
      t,
      state: pose as LuniState,
      expr,
      walk,
      phase: 0,
      blink: blink > 0 ? 1 : 0,
      scale: sc,
      edit: delta,
    });
  }
}

function exprToFrosch(e: LuniExpr): "neutral" | "friendly" | "grin" | "surprised" | "tired" {
  if (e === "grin" || e === "wink") return "grin";
  if (e === "surprised") return "surprised";
  if (e === "tired" || e === "sleep") return "tired";
  if (e === "neutral") return "neutral";
  return "friendly";
}
