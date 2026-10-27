import { useEffect, useRef } from "react";
import { drawLuni } from "@/game/luni";
import { drawOriginal, type OrigState } from "@/game/original";

/** Ursprungsfigur und Luni Seite an Seite, gleiche Pose, gleicher Maßstab. */
export function Compare({ zoom, paused }: { zoom: number; paused: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const p = useRef({ zoom, paused });
  p.current = { zoom, paused };

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

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const real = Math.min(0.05, (now - last) / 1000);
      last = now;
      const o = p.current;
      const dt = o.paused ? 0 : real;
      t += dt;
      walk += dt * 1.15;
      blinkT -= dt;
      if (blinkT <= 0) {
        blinkT = 2 + Math.random() * 3;
        blink = 0.14;
      }
      blink = Math.max(0, blink - dt);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.width / dpr;
      const h = cv.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Raumhintergrund wie im Spiel
      ctx.fillStyle = "#24424e";
      ctx.fillRect(0, 0, w, h);
      const groundY = h - 44;
      const fg = ctx.createLinearGradient(0, groundY, 0, h);
      fg.addColorStop(0, "#9a6540");
      fg.addColorStop(1, "#7c4e2f");
      ctx.fillStyle = fg;
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = "rgba(255,225,190,.18)";
      ctx.fillRect(0, groundY, w, 2);

      // Trennlinie
      ctx.strokeStyle = "rgba(255,255,255,.1)";
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, 10);
      ctx.lineTo(w / 2, groundY);
      ctx.stroke();
      ctx.setLineDash([]);

      const sc = o.zoom;
      const lx = w * 0.27;
      const rx = w * 0.73;

      // Scheitelmarke: beide sind 56 Einheiten hoch
      ctx.strokeStyle = "rgba(255,182,72,.4)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, groundY - 56 * sc);
      ctx.lineTo(w, groundY - 56 * sc);
      ctx.stroke();
      ctx.setLineDash([]);

      drawOriginal(ctx, lx, groundY, {
        t,
        face: 1,
        state: "walk",
        walk,
        walkAmt: 1,
        blink: blink > 0,
        scale: sc,
      });

      drawLuni(ctx, rx, groundY, {
        t,
        face: 1,
        state: "walk",
        expr: "happy",
        walk: walk * Math.PI * 2,
        blink: blink > 0 ? 1 : 0,
        scale: sc,
      });

      ctx.font = '600 11px "Space Grotesk", sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(238,247,242,.85)";
      ctx.fillText("Ursprungsfigur", lx, h - 14);
      ctx.fillStyle = "rgba(255,182,72,.95)";
      ctx.fillText("Luni (neu)", rx, h - 14);
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,182,72,.75)";
      ctx.font = '600 10px "Space Grotesk", sans-serif';
      ctx.fillText(`beide 56 Einheiten · ${Math.round(56 * sc)} px`, 10, groundY - 56 * sc - 6);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0" />;
}

/** Posen-Bogen der Ursprungsfigur. */
export function OrigPoseSheet({ items }: { items: { k: OrigState; label: string }[] }) {
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
      walk += dt * 1.15;
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
        drawOriginal(ctx, x0 + cw / 2, groundY, {
          t: t + i * 0.4,
          face: 1,
          state: it.k,
          walk: walk + i * 0.2,
          walkAmt: 1,
          vy: it.k === "air" ? -200 : 0,
          scale: SC,
          poseT: 1,
          downT: 0.45,
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
