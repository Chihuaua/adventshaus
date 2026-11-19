import { useEffect, useRef } from "react";
import { drawHund, type HundId, type HundPose } from "@/game/hunde";

/** Kontaktbogen: alle Posen live nebeneinander, ein Hund pro Canvas. */
export function HundPoseSheet({
  items,
  id,
}: {
  items: { k: HundPose; label: string }[];
  id: HundId;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const o = useRef({ items, id });
  o.current = { items, id };

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let gang = 0;
    let last = performance.now();
    const CH = 150;

    const resize = () => {
      const parent = cv.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const cols = Math.max(2, Math.min(5, Math.floor(w / 132)));
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
      gang += dt * 7;
      last = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.width / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, cv.height / dpr);

      const list = o.current.items;
      const cols = Math.max(2, Math.min(5, Math.floor(w / 132)));
      const cw = w / cols;
      const SC = 1.55;

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
        drawHund(ctx, o.current.id, x0 + cw / 2, groundY, {
          t: t + i * 0.4,
          pose: it.k,
          face: 1,
          gang: it.k === "walk" || it.k === "trot" ? gang : 0,
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

/** Seitenvergleich: beide Hunde nebeneinander in derselben Pose. */
export function HundCompare({
  items,
  poses,
}: {
  items: { id: HundId; label: string }[];
  poses: HundPose[];
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const o = useRef({ items, poses });
  o.current = { items, poses };

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let gang = 0;
    let last = performance.now();
    const CH = 130;

    const resize = () => {
      const parent = cv.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(o.current.poses.length * CH * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${o.current.poses.length * CH}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (cv.parentElement) ro.observe(cv.parentElement);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      t += dt;
      gang += dt * 7;
      last = now;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.width / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, cv.height / dpr);

      o.current.poses.forEach((pose, row) => {
        const y0 = row * CH;
        const groundY = y0 + CH - 24;
        ctx.fillStyle = "rgba(255,255,255,.03)";
        ctx.fillRect(6, y0 + 4, w - 12, CH - 8);
        ctx.fillStyle = "rgba(120,220,205,.14)";
        ctx.fillRect(14, groundY, w - 28, 1.5);

        ctx.fillStyle = "rgba(238,247,242,.6)";
        ctx.font = '600 10px "Space Grotesk", sans-serif';
        ctx.fillText(pose.toUpperCase(), 12, y0 + 18);

        const step = w / o.current.items.length;
        o.current.items.forEach((it, i) => {
          const x = step * i + step / 2;
          ctx.save();
          ctx.beginPath();
          ctx.rect(i * step, y0 + 4, step, CH - 8);
          ctx.clip();
          drawHund(ctx, it.id, x, groundY, {
            t: t + i * 0.55,
            pose,
            face: 1,
            gang: pose === "walk" || pose === "trot" ? gang : 0,
            scale: 1.5,
            shadow: false,
          });
          ctx.restore();
          ctx.fillStyle = "rgba(232,194,90,.85)";
          ctx.font = '600 9px "Space Grotesk", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText(it.label, x, y0 + CH - 8);
          ctx.textAlign = "left";
        });
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

/** Farbkacheln mit den Fellfarben eines Hundes. */
export function HundPalette({ farben }: { farben: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {farben.map((c) => (
        <div key={c.label} className="text-center">
          <div
            className="mx-auto h-8 w-full rounded-md ring-1 ring-white/15"
            style={{ background: c.value }}
          />
          <div className="mt-1 truncate text-[9px] text-mint-400">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Kopf-Nahaufnahmen beider Hunde als Merkmalsvergleich. */
export function HundKopfSheet({ id }: { id: HundId }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const o = useRef({ id });
  o.current = { id };

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const CH = 118;

    const resize = () => {
      const parent = cv.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(CH * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${CH}px`;
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
      ctx.clearRect(0, 0, w, CH);

      ctx.fillStyle = "rgba(255,255,255,.03)";
      ctx.fillRect(6, 6, w - 12, CH - 12);
      // Kopf steht bei y=-24 bis -29 über dem Boden
      drawHund(ctx, o.current.id, w / 2, CH - 8 + 34 * 3.1, {
        t,
        pose: "sit",
        face: 1,
        scale: 3.1,
        shadow: false,
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
