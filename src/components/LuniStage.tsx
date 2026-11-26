import { useEffect, useRef } from "react";
import { drawLuni, drawZzz, type LuniExpr, type LuniState } from "@/game/luni";
import { drawOriginal, type OrigState } from "@/game/original";
import { augenZu } from "@/game/duschprogramm";

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
  /** Duschbewegung (Code aus duschprogramm.ts), läuft als Schleife: drei Striche je Durchgang. */
  duschCode?: number | null;
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
  duschCode = null,
}: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const p = useRef({ state, expr, face, zoom, grid, paused, speed, variant, origState, duschCode });
  p.current = { state, expr, face, zoom, grid, paused, speed, variant, origState, duschCode };

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

      // Dusch-Einzelbewegung: Kabine, Brause und Wasser mitzeichnen, damit der
      // Griff nicht wie Stehen aussieht. Alles aus Canvas-Primitiven.
      if (o.variant !== "original" && o.duschCode !== null && o.duschCode !== undefined) {
        const cx = w / 2;
        const bw = 34 * sc;
        const top = groundY - 80 * sc;
        ctx.save();
        const wand = ctx.createLinearGradient(cx - bw, top, cx + bw, groundY);
        wand.addColorStop(0, "#123b3a");
        wand.addColorStop(1, "#0d2a2f");
        ctx.fillStyle = wand;
        ctx.fillRect(cx - bw, top, bw * 2, groundY - top);
        ctx.strokeStyle = "rgba(140,225,210,.14)";
        ctx.lineWidth = 1;
        for (let gy = top; gy < groundY; gy += 9 * sc) {
          ctx.beginPath(); ctx.moveTo(cx - bw, gy); ctx.lineTo(cx + bw, gy); ctx.stroke();
        }
        for (let gx = cx - bw; gx < cx + bw; gx += 9 * sc) {
          ctx.beginPath(); ctx.moveTo(gx, top); ctx.lineTo(gx, groundY); ctx.stroke();
        }
        ctx.strokeStyle = "#b9c6c8";
        ctx.lineWidth = Math.max(1.5, 1.6 * sc);
        ctx.beginPath();
        ctx.moveTo(cx - bw + 4 * sc, top + 4 * sc);
        ctx.lineTo(cx, top + 4 * sc);
        ctx.stroke();
        ctx.fillStyle = "#d7e2e2";
        ctx.beginPath();
        ctx.ellipse(cx, top + 7 * sc, 6 * sc, 2.4 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
        const wasserAn = Math.floor(o.duschCode) !== 14 || ((t % 3.6) / 3.6) > 0.5;
        if (wasserAn) {
          ctx.strokeStyle = "rgba(150,225,240,.5)";
          ctx.lineWidth = Math.max(1, 0.7 * sc);
          for (let i = 0; i < 16; i++) {
            const dx = cx + (i - 7.5) * 0.8 * sc;
            const lauf = (t * 2.2 + i * 0.13) % 1;
            const y0 = top + 9 * sc + lauf * (groundY - top - 12 * sc);
            ctx.beginPath();
            ctx.moveTo(dx, y0);
            ctx.lineTo(dx + 0.6 * sc, Math.min(groundY, y0 + 7 * sc));
            ctx.stroke();
          }
          ctx.fillStyle = "rgba(150,225,240,.16)";
          ctx.beginPath();
          ctx.ellipse(cx, groundY - 1, 16 * sc, 2.6 * sc, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        for (let i = 0; i < 3; i++) {
          const p2 = (t * 0.22 + i * 0.34) % 1;
          ctx.fillStyle = "rgba(220,245,245," + (0.10 * (1 - p2)).toFixed(3) + ")";
          ctx.beginPath();
          ctx.arc(cx + Math.sin(p2 * 6 + i) * 10 * sc, groundY - 20 * sc - p2 * 52 * sc, (5 + p2 * 9) * sc, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

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
        // Duschbewegung: ein Durchgang dauert 3,6 s, danach beginnt er von vorn.
        const dusche = o.duschCode !== null && o.duschCode !== undefined;
        const duschPhase = dusche ? (o.duschCode as number) + Math.min(0.999, (t % 3.6) / 3.6) : 0;
        drawLuni(ctx, w / 2, groundY, {
          t,
          face: o.face,
          state: dusche ? "wash" : o.state,
          expr: dusche ? (augenZu(duschPhase) ? "sleep" : "happy") : o.expr,
          walk,
          phase: dusche ? duschPhase : phase,
          blink: blink > 0 ? 1 : 0,
          scale: sc,
          ...(dusche ? { outfit: "towel" as const, socken: false, wet: 1, glasses: false } : {}),
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
