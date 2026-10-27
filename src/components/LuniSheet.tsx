import { useEffect, useRef } from "react";
import { drawLuni, type LuniExpr, type LuniState } from "@/game/luni";

/** Kontaktbogen: alle Mimiken als Kopf-Nahaufnahme. */
export function ExprSheet({ items }: { items: { k: LuniExpr; label: string }[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const o = useRef({ items });
  o.current = { items };

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const CH = 126;

    const resize = () => {
      const parent = cv.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const cols = Math.max(2, Math.min(6, Math.floor(w / 112)));
      const rows = Math.ceil(o.current.items.length / cols);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(rows * CH * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${rows * CH}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (cv.parentElement) ro.observe(cv.parentElement);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      t += Math.min(0.05, (now - last) / 1000);
      last = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.width / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, cv.height / dpr);

      const list = o.current.items;
      const cols = Math.max(2, Math.min(6, Math.floor(w / 112)));
      const cw = w / cols;
      const SC = 2.5;

      list.forEach((it, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x0 = col * cw;
        const y0 = row * CH;

        ctx.fillStyle = "rgba(255,255,255,.03)";
        ctx.fillRect(x0 + 4, y0 + 4, cw - 8, CH - 8);

        ctx.save();
        ctx.beginPath();
        ctx.rect(x0 + 4, y0 + 4, cw - 8, CH - 26);
        ctx.clip();
        // Kopf steht bei y = -46.5 -> Boden so legen, dass der Kopf im Feld sitzt
        drawLuni(ctx, x0 + cw / 2, y0 + CH - 26 + 46.5 * SC + 10, {
          t: t + i * 0.7,
          face: 1,
          state: "idle",
          expr: it.k,
          scale: SC,
          shadow: false,
        });
        ctx.restore();

        ctx.fillStyle = "rgba(238,247,242,.72)";
        ctx.font = '600 10px "Space Grotesk", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(it.label, x0 + cw / 2, y0 + CH - 8);
        ctx.textAlign = "left";
      });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="w-full" />;
}

/** Posen-Übersicht: alle Haltungen live nebeneinander. */
export function PoseSheet({ items }: { items: { k: LuniState; label: string }[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const o = useRef({ items });
  o.current = { items };

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let walk = 0;
    let phase = 0;
    let last = performance.now();
    const CH = 150;

    const resize = () => {
      const parent = cv.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const cols = Math.max(2, Math.min(5, Math.floor(w / 130)));
      const rows = Math.ceil(o.current.items.length / cols);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(rows * CH * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${rows * CH}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (cv.parentElement) ro.observe(cv.parentElement);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      t += dt;
      walk += dt * 7.2;
      phase = (phase + dt / 1.3) % 1;
      last = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.width / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, cv.height / dpr);

      const list = o.current.items;
      const cols = Math.max(2, Math.min(5, Math.floor(w / 130)));
      const cw = w / cols;
      const SC = 1.5;

      list.forEach((it, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x0 = col * cw;
        const y0 = row * CH;
        const groundY = y0 + CH - 26;

        ctx.fillStyle = "rgba(255,255,255,.03)";
        ctx.fillRect(x0 + 4, y0 + 4, cw - 8, CH - 8);
        ctx.fillStyle = "rgba(120,220,205,.14)";
        ctx.fillRect(x0 + 10, groundY, cw - 20, 1.5);

        ctx.save();
        ctx.beginPath();
        ctx.rect(x0 + 4, y0 + 4, cw - 8, CH - 10);
        ctx.clip();
        drawLuni(ctx, x0 + cw / 2, groundY, {
          t: t + i * 0.4,
          face: 1,
          state: it.k,
          expr: it.k === "doze" || it.k === "lie" ? "sleep" : "happy",
          walk: walk + i,
          phase,
          scale: SC,
        });
        ctx.restore();

        ctx.fillStyle = "rgba(238,247,242,.72)";
        ctx.font = '600 10px "Space Grotesk", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(it.label, x0 + cw / 2, y0 + CH - 8);
        ctx.textAlign = "left";
      });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="w-full" />;
}

/** Laufzyklus als Filmstreifen. */
export function WalkStrip() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const FRAMES = 8;
    const H = 116;

    const resize = () => {
      const parent = cv.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${H}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (cv.parentElement) ro.observe(cv.parentElement);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      t += Math.min(0.05, (now - last) / 1000);
      last = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.width / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, H);

      const cw = w / FRAMES;
      const live = Math.floor(((t * 7.2) / (Math.PI * 2)) * FRAMES) % FRAMES;
      for (let i = 0; i < FRAMES; i++) {
        const ph = (i / FRAMES) * Math.PI * 2;
        ctx.fillStyle = i === live ? "rgba(53,214,192,.12)" : "rgba(255,255,255,.03)";
        ctx.fillRect(i * cw + 3, 4, cw - 6, H - 8);
        drawLuni(ctx, i * cw + cw / 2, H - 16, {
          t,
          face: 1,
          state: "walk",
          expr: "happy",
          walk: ph,
          scale: 1.5,
          shadow: false,
        });
        ctx.fillStyle = "rgba(238,247,242,.4)";
        ctx.font = '600 9px "Space Grotesk", sans-serif';
        ctx.fillText(`${i + 1}`, i * cw + 8, 16);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="w-full" />;
}

/** Spielgröße im Raumkontext (Tür, Sofa, Tisch, Hund-Platzhalter). */
export function ScaleCheck() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let walk = 0;
    let last = performance.now();
    const H = 200;

    const resize = () => {
      const parent = cv.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${H}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (cv.parentElement) ro.observe(cv.parentElement);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      t += dt;
      walk += dt * 7.2;
      last = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.width / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = "#24424e";
      ctx.fillRect(0, 0, w, H);
      const groundY = H - 30;

      const fg = ctx.createLinearGradient(0, groundY, 0, H);
      fg.addColorStop(0, "#9a6540");
      fg.addColorStop(1, "#7c4e2f");
      ctx.fillStyle = fg;
      ctx.fillRect(0, groundY, w, H - groundY);
      ctx.fillStyle = "rgba(255,225,190,.18)";
      ctx.fillRect(0, groundY, w, 2);

      // Tür (ca. 2 m -> 110 Einheiten)
      const doorH = 110;
      ctx.fillStyle = "#8a6a3c";
      ctx.fillRect(24, groundY - doorH, 46, doorH);
      ctx.fillStyle = "#a3804a";
      ctx.fillRect(28, groundY - doorH + 4, 38, doorH - 8);
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(60, groundY - doorH / 2, 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Tisch
      ctx.fillStyle = "#8a6a3c";
      ctx.fillRect(w - 130, groundY - 40, 70, 6);
      ctx.fillRect(w - 126, groundY - 34, 5, 34);
      ctx.fillRect(w - 66, groundY - 34, 5, 34);

      // Sofa
      ctx.fillStyle = "#3f7f8c";
      ctx.fillRect(w - 232, groundY - 30, 76, 30);
      ctx.fillStyle = "#59a3ac";
      ctx.fillRect(w - 228, groundY - 43, 68, 16);

      // Hund-Platzhalter
      ctx.fillStyle = "#191920";
      ctx.beginPath();
      ctx.ellipse(w - 268, groundY - 11, 19, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w - 284, groundY - 20, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f6f3ea";
      ctx.beginPath();
      ctx.ellipse(w - 268, groundY - 7, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      const sc = 1;
      drawLuni(ctx, 110, groundY, { t, face: 1, state: "idle", expr: "happy", scale: sc });
      drawLuni(ctx, 175, groundY, { t, face: 1, state: "walk", expr: "neutral", walk, scale: sc });
      drawLuni(ctx, 240, groundY, { t, face: -1, state: "act", expr: "grin", scale: sc });
      drawLuni(ctx, 305, groundY, { t, face: 1, state: "danceSway", expr: "happy", scale: sc });

      ctx.fillStyle = "rgba(238,247,242,.6)";
      ctx.font = '600 10px "Space Grotesk", sans-serif';
      ctx.fillText("Spielgröße 1.0 · 56 px · Tür 110 px", 10, 16);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="w-full" />;
}

export type { LuniExpr, LuniState };
