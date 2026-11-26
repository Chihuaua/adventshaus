import { useEffect, useRef, useState } from "react";
import { drawLuni } from "@/game/luni";
import { allTanzMoves, setTanzParams, TANZ_GRUPPEN, type TanzMove } from "@/game/tanz";

/** Neues Tanzstudio: ein lebendiger Tanzboden. Oben ein Spotlight für den
 *  gewählten Tanz (mit Beat-Puls und Tempo), darunter ein Boden aus allen
 *  Tänzern – nach Kategorie gruppiert, jeder tanzt live in seiner Kachel. */
export default function TanzStudio() {
  const [version, setVersion] = useState(0);
  const [selKey, setSelKey] = useState<string>("danceSchritt");
  const refresh = () => setVersion((v) => v + 1);

  const moves = allTanzMoves();
  const sel = moves.find((m) => m.key === selKey) ?? moves[0];
  const anzahl = moves.length;

  return (
    <div className="bg-room grid-floor min-h-[100dvh] w-full overflow-x-hidden p-3 sm:p-5">
      <div className="mx-auto w-full max-w-[1180px]" key={version}>
        {/* Kopf */}
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-[8px] tracking-[0.3em] text-teal sm:text-[10px]">
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-coral" />
                LITTLE COMPUTER LUNI · TANZBODEN
              </span>
              <a
                href="#studio"
                className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                ← STUDIO
              </a>
            </div>
            <h1 className="mt-1 font-display text-[26px] leading-none text-mint-50 text-shadow-hard sm:text-[36px]">
              TANZ<span className="text-amber-glow">BODEN</span>
            </h1>
            <p className="mt-1.5 max-w-[64ch] text-[12px] leading-relaxed text-mint-200/80">
              {anzahl} Tänze, drei Kategorien, alles im Takt. Unten tanzt der ganze Boden live –
              ein Klick holt einen Tänzer ins Spotlight. Das Tempo wirkt sofort, auch im Spiel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {TANZ_GRUPPEN.map((g) => {
              const n = moves.filter((m) => m.gruppe === g).length;
              return (
                <div
                  key={g}
                  className="rounded-lg bg-[#08151a]/70 px-2.5 py-1.5 text-center ring-1 ring-white/10"
                >
                  <div className="font-display text-[13px] leading-none text-teal">{n}</div>
                  <div className="mt-0.5 text-[8px] uppercase tracking-[0.14em] text-mint-400">{g}</div>
                </div>
              );
            })}
          </div>
        </header>

        <div className="grid gap-3 lg:grid-cols-[1.05fr_1fr]">
          {/* Spotlight */}
          <Spotlight move={sel} onTempo={(v) => { if (sel) { setTanzParams(sel.key, { speed: v }); refresh(); } }} />

          {/* Tanzboden */}
          <section className="rounded-2xl bg-[#08151a] p-1.5 ring-1 ring-teal/20 sm:p-2">
            <div className="mb-1.5 flex items-baseline justify-between px-1.5 pt-1">
              <h2 className="font-display text-[10px] tracking-[0.26em] text-teal">TANZBODEN · ALLE LIVE</h2>
              <span className="text-[10px] text-mint-400/70">Klicken = Spotlight</span>
            </div>
            <DanceFloor moves={moves} selKey={sel?.key ?? ""} onSelect={(k) => setSelKey(k)} />
          </section>
        </div>

        <p className="mt-3 pb-2 text-center text-[11px] text-mint-400/60">
          Änderungen am Tempo wirken live im gemeinsamen Tanz-Register – und damit direkt im Spiel.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------ Spotlight ------------------------------ */

function Spotlight({ move, onTempo }: { move: TanzMove | undefined; onTempo: (v: number) => void }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const keyRef = useRef(move?.key);
  keyRef.current = move?.key;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let walk = 0;
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
      const moves = allTanzMoves();
      const m = moves.find((x) => x.key === keyRef.current) ?? moves[0];
      const speed = m?.params.speed ?? 1;
      t += real * speed;
      walk += real * 7.2 * speed;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.width / dpr;
      const h = cv.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Hintergrund mit Beat-Puls (2 Schläge pro Sekunde bei Tempo 1)
      const beat = ((t * 2) % 1 + 1) % 1;
      const pulse = Math.pow(Math.max(0, Math.sin(beat * Math.PI)), 2);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#132430");
      g.addColorStop(1, "#0a141a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Beat-Glow hinter der Figur
      const gg = ctx.createRadialGradient(w / 2, h * 0.5, 10, w / 2, h * 0.5, h * 0.55);
      gg.addColorStop(0, `rgba(53,214,192,${0.10 + pulse * 0.12})`);
      gg.addColorStop(1, "rgba(53,214,192,0)");
      ctx.fillStyle = gg;
      ctx.fillRect(0, 0, w, h);

      const groundY = h * 0.8;
      const sc = Math.min(6.2, h / 88);

      // Tanzboden-Linie + weicher Spot
      ctx.fillStyle = "#1a3038";
      ctx.fillRect(0, groundY, w, h - groundY);
      const spot = ctx.createLinearGradient(0, groundY, 0, h);
      spot.addColorStop(0, `rgba(53,214,192,${0.10 + pulse * 0.10})`);
      spot.addColorStop(1, "rgba(53,214,192,0)");
      ctx.fillStyle = spot;
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = `rgba(255,255,255,${0.10 + pulse * 0.1})`;
      ctx.fillRect(0, groundY, w, 2);

      if (m) {
        // Spiegelung auf dem Boden (dezent)
        ctx.save();
        ctx.translate(0, groundY * 2);
        ctx.scale(1, -1);
        ctx.globalAlpha = 0.10;
        drawLuni(ctx, w / 2, groundY, { t, face: 1, state: m.base as never, walk, beatT: t, scale: sc, shadow: false });
        ctx.restore();
        // Figur
        drawLuni(ctx, w / 2, groundY, { t, face: 1, state: m.base as never, walk, beatT: t, scale: sc, shadow: true });
      }

      // Beat-Punkte unten
      const dotActive = Math.floor(beat * 4) % 4;
      for (let i = 0; i < 4; i++) {
        const dx = w / 2 - 30 + i * 20;
        const on = i === dotActive;
        ctx.beginPath();
        ctx.arc(dx, h - 16, on ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = on ? "#35d6c0" : "rgba(120,220,205,.25)";
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const speed = move?.params.speed ?? 1;

  return (
    <section className="rounded-2xl bg-[#08151a] p-1.5 ring-1 ring-teal/20 sm:p-2">
      <div className="screen-glass relative h-[380px] overflow-hidden rounded-xl sm:h-[470px]">
        <canvas ref={ref} className="absolute inset-0" />
        <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/45 px-2 py-1 font-display text-[9px] tracking-[0.18em] text-mint-200">
          SPOTLIGHT · {move ? move.label.toUpperCase() : "–"}
        </div>
      </div>

      {move && (
        <div className="mt-2 space-y-2 px-1 pb-1">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-[15px] text-mint-50">{move.label}</span>
              <span className="rounded bg-[#132a33] px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-teal ring-1 ring-white/10">
                {move.gruppe}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-mint-200/70">{move.text}</p>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-mint-400">
            <span className="w-14 shrink-0">Tempo</span>
            <input
              type="range"
              min={0.4}
              max={2}
              step={0.05}
              value={speed}
              onChange={(e) => onTempo(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-ink-700 accent-teal"
            />
            <span className="w-10 text-right tabular-nums text-mint-200">{speed.toFixed(2)}×</span>
          </label>
        </div>
      )}
    </section>
  );
}

/* ------------------------------ Tanzboden ------------------------------ */

const TILE_W = 118;
const TILE_H = 128;
const HEAD_H = 30;

function DanceFloor({ moves, selKey, onSelect }: { moves: TanzMove[]; selKey: string; onSelect: (k: string) => void }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ moves, selKey, hover: -1 });
  stateRef.current = { moves, selKey, hover: stateRef.current.hover };
  const cellsRef = useRef<{ move: TanzMove; x: number; y: number; w: number; h: number }[]>([]);

  useEffect(() => {
    const cv = ref.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let last = performance.now();

    const layout = () => {
      const w = wrap.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pad = 6;
      const cols = Math.max(1, Math.floor((w - pad * 2) / (TILE_W + 8)));
      const cellW = (w - pad * 2 - (cols - 1) * 8) / cols;
      const cells: typeof cellsRef.current = [];
      let y = pad;
      for (const g of TANZ_GRUPPEN) {
        const list = stateRef.current.moves.filter((m) => m.gruppe === g);
        if (!list.length) continue;
        y += HEAD_H;
        let col = 0;
        list.forEach((m) => {
          const cx = pad + col * (cellW + 8);
          cells.push({ move: m, x: cx, y, w: cellW, h: TILE_H });
          col++;
          if (col >= cols) { col = 0; y += TILE_H + 8; }
        });
        if (col !== 0) y += TILE_H + 8;
      }
      const height = Math.max(160, y - 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(height * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${height}px`;
      cellsRef.current = cells;
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(wrap);

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      const rad = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + w, y, x + w, y + h, rad);
      ctx.arcTo(x + w, y + h, x, y + h, rad);
      ctx.arcTo(x, y + h, x, y, rad);
      ctx.arcTo(x, y, x + w, y, rad);
      ctx.closePath();
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const real = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += real;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.width / dpr;
      const h = cv.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const { moves: mv, selKey: sk, hover } = stateRef.current;

      // Kategorie-Überschriften
      let hy = 6;
      for (const g of TANZ_GRUPPEN) {
        const list = mv.filter((m) => m.gruppe === g);
        if (!list.length) continue;
        hy += HEAD_H;
        ctx.fillStyle = "rgba(53,214,192,.85)";
        ctx.font = '600 10px "Space Grotesk", sans-serif';
        ctx.fillText(g.toUpperCase(), 8, hy - 11);
        ctx.fillStyle = "rgba(120,220,205,.15)";
        ctx.fillRect(8, hy - 7, w - 16, 1);
        const cols = Math.max(1, Math.floor((w - 12) / (TILE_W + 8)));
        const rows = Math.ceil(list.length / cols);
        hy += rows * (TILE_H + 8);
      }

      // Kacheln + Tänzer
      cellsRef.current.forEach((c, i) => {
        const m = c.move;
        const speed = m.params.speed;
        const isSel = m.key === sk;
        const isHov = i === hover;
        // Kachel-Hintergrund
        rr(c.x, c.y, c.w, c.h, 10);
        ctx.fillStyle = isSel ? "rgba(53,214,192,.10)" : isHov ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.025)";
        ctx.fill();
        ctx.lineWidth = isSel ? 1.6 : 1;
        ctx.strokeStyle = isSel ? "rgba(53,214,192,.85)" : isHov ? "rgba(140,220,205,.4)" : "rgba(255,255,255,.07)";
        ctx.stroke();
        // Boden in der Kachel
        const floorY = c.y + c.h - 30;
        ctx.fillStyle = "rgba(255,255,255,.06)";
        ctx.fillRect(c.x + 10, floorY, c.w - 20, 1.4);
        // Tänzer (eigenes Tempo + leichte Phasenverschiebung)
        ctx.save();
        ctx.beginPath();
        ctx.rect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
        ctx.clip();
        drawLuni(ctx, c.x + c.w / 2, floorY, {
          t: t + i * 0.13,
          face: 1,
          state: m.base as never,
          walk: t * 7.2 * speed,
          beatT: t * speed + i * 0.13,
          scale: Math.min(1.55, c.w / 82),
          shadow: false,
        });
        ctx.restore();
        // Label
        ctx.fillStyle = isSel ? "#8ff2dc" : "rgba(238,247,242,.72)";
        ctx.font = '600 10px "Space Grotesk", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(m.label, c.x + c.w / 2, c.y + c.h - 9);
        ctx.textAlign = "left";
      });
    };
    raf = requestAnimationFrame(frame);

    const hit = (e: PointerEvent) => {
      const rect = cv.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return cellsRef.current.findIndex((c) => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h);
    };
    const onMove = (e: PointerEvent) => {
      const i = hit(e);
      stateRef.current.hover = i;
      cv.style.cursor = i >= 0 ? "pointer" : "default";
    };
    const onLeave = () => { stateRef.current.hover = -1; };
    const onClick = (e: PointerEvent) => {
      const i = hit(e);
      if (i >= 0) onSelect(cellsRef.current[i].move.key);
    };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerleave", onLeave);
    cv.addEventListener("pointerdown", onClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerleave", onLeave);
      cv.removeEventListener("pointerdown", onClick);
    };
  }, [moves, selKey, onSelect]);

  return (
    <div ref={wrapRef} className="w-full">
      <canvas ref={ref} className="block w-full" />
    </div>
  );
}
