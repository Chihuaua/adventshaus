import { useEffect, useRef, useState } from "react";
import { drawLuniMon, LUNI_MONS, type LuniMon } from "@/game/mons";

interface Props {
  tuer: number;
  zoom: number;
  paused: boolean;
  speed: number;
}

/** Große animierte Bühne für einen einzelnen Luni-Mon. */
function MonsStage({ tuer, zoom, paused, speed }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const p = useRef({ tuer, zoom, paused, speed });
  p.current = { tuer, zoom, paused, speed };

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
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
      t += o.paused ? 0 : real * o.speed;

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
      ctx.fillStyle = "#1a3038";
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = "rgba(255,255,255,.07)";
      ctx.fillRect(0, groundY, w, 2);

      const mon = LUNI_MONS.find((m) => m.tuer === tuer);
      if (!mon) return;
      const sk = o.zoom * Math.min(1, 1.6);
      drawLuniMon(ctx, tuer, w / 2, groundY, t, sk);

      ctx.fillStyle = "rgba(238,247,242,.72)";
      ctx.font = '600 11px "Space Grotesk", sans-serif';
      ctx.fillText(
        `${mon.name} · Körpergröße ${mon.groesse} Einheiten · ${Math.round(mon.groesse * sk)} px`,
        12,
        groundY + 20,
      );
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0" />;
}

/** Kontakt-Bogen: alle 24 Luni-Mons nebeneinander. */
function MonsBogen({
  mons,
  aktiv,
  onSelect,
}: {
  mons: LuniMon[];
  aktiv: number;
  onSelect: (tuer: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const o = useRef({ mons, aktiv, onSelect });
  o.current = { mons, aktiv, onSelect };

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const CH = 150;

    const resize = () => {
      const parent = cv.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const cols = Math.max(2, Math.min(6, Math.floor(w / 150)));
      const rows = Math.ceil(o.current.mons.length / cols);
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
      last = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.width / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, cv.height / dpr);

      const list = o.current.mons;
      const cols = Math.max(2, Math.min(6, Math.floor(w / 150)));
      const cw = w / cols;

      list.forEach((mon, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x0 = col * cw;
        const y0 = row * CH;
        const groundY = y0 + CH - 26;
        const aktiv = o.current.aktiv === mon.tuer;

        ctx.fillStyle = aktiv ? "rgba(53,214,192,.10)" : "rgba(255,255,255,.03)";
        ctx.fillRect(x0 + 4, y0 + 4, cw - 8, CH - 8);
        ctx.fillStyle = "rgba(120,220,205,.14)";
        ctx.fillRect(x0 + 10, groundY, cw - 20, 1.5);
        if (aktiv) {
          ctx.strokeStyle = "rgba(53,214,192,.55)";
          ctx.lineWidth = 1.4;
          ctx.strokeRect(x0 + 4, y0 + 4, cw - 8, CH - 8);
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(x0 + 4, y0 + 4, cw - 8, CH - 10);
        ctx.clip();
        drawLuniMon(ctx, mon.tuer, x0 + cw / 2, groundY, t + i * 0.35, 1.35);
        ctx.restore();

        ctx.fillStyle = "rgba(238,247,242,.72)";
        ctx.font = '600 10px "Space Grotesk", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(mon.name, x0 + cw / 2, y0 + CH - 8);
        ctx.textAlign = "left";
      });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // Klick auf eine Kachel wählt den Mon aus
  return (
    <canvas
      ref={ref}
      className="w-full cursor-pointer"
      onClick={(e) => {
        const cv = e.currentTarget;
        const r = cv.getBoundingClientRect();
        const w = r.width;
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const cols = Math.max(2, Math.min(6, Math.floor(w / 150)));
        const col = Math.floor(x / (w / cols));
        const row = Math.floor(y / 150);
        const index = row * cols + col;
        const mon = o.current.mons[index];
        if (mon) o.current.onSelect(mon.tuer);
      }}
    />
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-press rounded-md px-2.5 py-1.5 text-[11px] font-medium tracking-wide transition ${
        active
          ? "bg-teal text-[#04211d] shadow-[0_0_14px_-4px_rgba(53,214,192,.8)]"
          : "bg-[#132a33] text-mint-200 ring-1 ring-white/10 hover:bg-ink-700 hover:text-mint-50"
      }`}
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-[#0a1c23]/80 p-3 ring-1 ring-white/10 sm:p-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[10px] tracking-[0.26em] text-teal sm:text-[11px]">{title}</h2>
        {hint && <span className="text-[10px] text-mint-400/70">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export default function MonsStudio() {
  const [tuer, setTuer] = useState(1);
  const [zoom, setZoom] = useState(4.4);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const mon = LUNI_MONS.find((m) => m.tuer === tuer) ?? LUNI_MONS[0];

  return (
    <div className="bg-room grid-floor min-h-[100dvh] w-full overflow-x-hidden p-3 sm:p-5">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-[8px] tracking-[0.3em] text-teal sm:text-[10px]">
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-coral" />
                LITTLE COMPUTER LUNI · MON-ENTWURF
              </span>
              <a
                href="#studio"
                className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                ← LUNI-STUDIO
              </a>
              <a
                href="#studio-odin"
                className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                ODIN-STUDIO
              </a>
              <a
                href="#studio-apollo"
                className="rounded bg-[#132a33] px-2 py-1 tracking-[0.2em] text-amber-glow ring-1 ring-white/10 transition hover:bg-ink-700"
              >
                APOLLO-STUDIO
              </a>
            </div>
            <h1 className="mt-1 font-display text-[22px] leading-none text-mint-50 text-shadow-hard sm:text-[34px]">
              LUNI-MON <span className="text-amber-glow">STUDIO</span>
            </h1>
            <p className="mt-1.5 max-w-[66ch] text-[12px] leading-relaxed text-mint-200/80 sm:text-[13px]">
              24 Begleiter, angelehnt an bekannte Sammelwesen, aber eigenständig
              weiterentwickelt. Jedes Türchen schaltet später genau einen Mons frei.
              Aktuell nur Kontakt-Bogen und Entwurf – Bewegung im Haus, Interaktion
              und Freischaltung kommen, sobald alle 24 feststehen.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip active={paused} onClick={() => setPaused((v) => !v)}>
              {paused ? "Weiter" : "Standbild"}
            </Chip>
          </div>
        </header>

        <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
          {/* Bühne */}
          <div className="rounded-2xl bg-[#08151a] p-1.5 ring-1 ring-teal/20 sm:p-2">
            <div className="screen-glass relative h-[380px] overflow-hidden rounded-xl sm:h-[480px]">
              <MonsStage tuer={tuer} zoom={zoom} paused={paused} speed={speed} />
              <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/45 px-2 py-1 font-display text-[9px] tracking-[0.18em] text-mint-200">
                {mon.name.toUpperCase()} · TÜRCHEN {mon.tuer} · {mon.ort}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 px-1 pb-1">
              <label className="flex min-w-[170px] flex-1 items-center gap-2 text-[11px] text-mint-400">
                Zoom
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-ink-700 accent-teal"
                />
                <span className="w-9 text-right tabular-nums text-mint-200">{zoom.toFixed(1)}×</span>
              </label>
              <label className="flex min-w-[150px] items-center gap-2 text-[11px] text-mint-400">
                Tempo
                <input
                  type="range"
                  min={0.15}
                  max={1.6}
                  step={0.05}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-ink-700 accent-amber-glow"
                />
                <span className="w-9 text-right tabular-nums text-mint-200">{speed.toFixed(2)}×</span>
              </label>
              <Chip active={false} onClick={() => setZoom(1)}>
                Spielgröße
              </Chip>
            </div>
          </div>

          {/* Steuerung */}
          <div className="space-y-3">
            <Panel title="AUSWAHL" hint="24 Türchen · 1–24">
              <div className="grid grid-cols-6 gap-1.5">
                {LUNI_MONS.map((m) => (
                  <Chip key={m.tuer} active={tuer === m.tuer} onClick={() => setTuer(m.tuer)}>
                    {m.tuer}
                  </Chip>
                ))}
              </div>
            </Panel>

            <Panel title={`FARBEN · ${mon.name.toUpperCase()}`}>
              <div className="grid grid-cols-4 gap-2">
                {mon.farben.map((c) => (
                  <div key={c.label} className="text-center">
                    <div
                      className="mx-auto h-8 w-full rounded-md ring-1 ring-white/15"
                      style={{ background: c.value }}
                    />
                    <div className="mt-1 truncate text-[9px] text-mint-400">{c.label}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="BESCHREIBUNG">
              <p className="text-[11px] leading-relaxed text-mint-200/80">{mon.beschreibung}</p>
            </Panel>

            <Panel title="BAUMASSE">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                {[
                  ["Körpergröße", `${mon.groesse} Einheiten`],
                  ["Türchen", `${mon.tuer} von 24`],
                  ["Wohnort", mon.ort],
                  ["Maler", "Canvas-Primitive"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 border-b border-white/5 py-0.5">
                    <dt className="text-mint-400">{k}</dt>
                    <dd className="text-mint-50 tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
        </div>

        <div className="mt-3 grid gap-3">
          <Panel
            title="LUNI-MONS · KONTAKT-BOGEN"
            hint="alle 24 live · Klick wählt aus"
          >
            <div className="overflow-hidden rounded-lg bg-[#08151a]/60">
              <MonsBogen
                mons={LUNI_MONS}
                aktiv={tuer}
                onSelect={(t) => setTuer(t)}
              />
            </div>
          </Panel>
        </div>

        <p className="mt-3 pb-2 text-center text-[11px] text-mint-400/60">
          Freischaltung über die Türchen, Bewegung im Haus und Interaktion kommen,
          sobald alle 24 feststehen.
        </p>
      </div>
    </div>
  );
}
