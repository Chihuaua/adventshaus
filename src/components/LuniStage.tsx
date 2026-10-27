import { useEffect, useRef } from "react";
import { drawLuni, drawZzz, type LuniExpr, type LuniState } from "@/game/luni";
import { drawOriginal, type OrigState } from "@/game/original";

interface Props {
  state: LuniState;
  expr: LuniExpr;
  face: 1 | -1;
  zoom: number;
  grid: boolean;
  paused: boolean;
  speed: number;
  variant?: "luni" | "original";
  origState?: OrigState;
}

/** Große, animierte Bühne mit Bodenlinie und Maßraster. */
export function LuniStage({
  state,
  expr,
  face,
  zoom,
  grid,
  paused,
  speed,
  variant = "luni",
  origState = "idle",
}: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const p = useRef({ state, expr, face, zoom, grid, paused, speed, variant, origState });
  p.current = { state, expr, face, zoom, grid, paused, speed, variant, origState };

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let walk = 0;
    let phase = 0;
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
      const dt = o.paused ? 0 : real * o.speed;
      t += dt;
      if (o.variant === "original") walk += dt * 7.2;
      else if (o.state === "walk") walk += dt * 7.2;
      else if (o.state === "run") walk += dt * 12;
      const cyc = o.state === "turn" ? 1.1 : o.state === "cartwheel" ? 1.5 : 1.2;
      phase = (phase + dt / cyc) % 1;
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
        ctx.strokeStyle = "rgba(255,182,72,.45)";
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, groundY - 56 * sc);
        ctx.lineTo(w, groundY - 56 * sc);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,182,72,.85)";
        ctx.font = '600 11px "Space Grotesk", sans-serif';
        ctx.fillText(`Scheitel · 56 Einheiten · ${Math.round(56 * sc)} px`, 10, groundY - 56 * sc - 7);
        ctx.restore();
      }

      ctx.fillStyle = "#1a3038";
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = "rgba(255,255,255,.07)";
      ctx.fillRect(0, groundY, w, 2);

      if (o.variant === "original") {
        drawOriginal(ctx, w / 2, groundY, {
          t,
          face: o.face,
          state: o.origState,
          walk: walk / (Math.PI * 2),
          walkAmt: 1,
          vy: o.origState === "air" ? -200 : 0,
          blink: blink > 0,
          scale: sc,
          poseT: 1,
          downT: 0.45,
        });
        if (o.origState === "lie") {
          drawZzz(ctx, w / 2 + 30 * sc, groundY - 36 * sc, t, sc);
        }
      } else {
        drawLuni(ctx, w / 2, groundY, {
          t,
          face: o.face,
          state: o.state,
          expr: o.expr,
          walk,
          phase,
          blink: blink > 0 ? 1 : 0,
          scale: sc,
        });

        if (o.state === "doze" || o.state === "lie" || o.expr === "sleep") {
          drawZzz(ctx, w / 2 + 16 * sc * o.face, groundY - 52 * sc, t, sc);
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0" />;
}
