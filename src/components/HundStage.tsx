import { useEffect, useRef } from "react";
import { drawHund, type HundId, type HundPose } from "@/game/hunde";
import { zeichneAtelierHund } from "@/game/atelier/hundefell";

interface Props {
  id: HundId;
  pose: HundPose;
  face: 1 | -1;
  zoom: number;
  grid: boolean;
  paused: boolean;
  speed: number;
}

function mapPose(p: HundPose): "ruhe" | "gang" | "sitzen" | "aktion" {
  if (p === "sit" || p === "lie" || p === "sleep") return "sitzen";
  if (p === "walk" || p === "trot") return "gang";
  if (p === "stand") return "ruhe";
  return "aktion";
}

/** Große animierte Bühne für Odin oder Apollo, mit Boden und Maßraster. */
export function HundStage({ id, pose, face, zoom, grid, paused, speed }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const p = useRef({ id, pose, face, zoom, grid, paused, speed });
  p.current = { id, pose, face, zoom, grid, paused, speed };

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let gang = 0;
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
      // Gangzyklus nur in den Bewegungsposen weiterschalten
      if (o.pose === "walk") gang += dt * 6.5;
      else if (o.pose === "trot") gang += dt * 11;
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
        // Schulterhöhe je Hund als Maßlinie
        const schulter = o.id === "apollo" ? 29.6 : 29.4;
        ctx.strokeStyle = "rgba(255,182,72,.45)";
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, groundY - schulter * sc);
        ctx.lineTo(w, groundY - schulter * sc);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,182,72,.85)";
        ctx.font = '600 11px "Space Grotesk", sans-serif';
        ctx.fillText(
          `Schulterhöhe · ${schulter.toFixed(1)} Einheiten · ${Math.round(schulter * sc)} px`,
          10,
          groundY - schulter * sc - 7,
        );
        ctx.restore();
      }

      ctx.fillStyle = "#1a3038";
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = "rgba(255,255,255,.07)";
      ctx.fillRect(0, groundY, w, 2);

      drawHund(ctx, o.id, w / 2, groundY, {
        t,
        face: o.face,
        pose: o.pose,
        gang,
        blinzeln: blink > 0,
        scale: sc,
      });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0" />;
}

/** Aufgehuebschte Feinzeichnung desselben Hundes mit Nikolaus-Detailtiefe. */
export function FeinHundStage({ id, pose, face, zoom, grid, paused, speed }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const p = useRef({ id, pose, face, zoom, grid, paused, speed });
  p.current = { id, pose, face, zoom, grid, paused, speed };

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
      const dt = o.paused ? 0 : real * o.speed;
      t += dt;

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
        const schulter = o.id === "apollo" ? 29.6 : 29.4;
        ctx.strokeStyle = "rgba(255,182,72,.45)";
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, groundY - schulter * sc);
        ctx.lineTo(w, groundY - schulter * sc);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,182,72,.85)";
        ctx.font = '600 11px "Space Grotesk", sans-serif';
        ctx.fillText(
          `Schulterhöhe · ${schulter.toFixed(1)} Einheiten · ${Math.round(schulter * sc)} px`,
          10,
          groundY - schulter * sc - 7,
        );
        ctx.restore();
      }

      ctx.fillStyle = "#1a3038";
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = "rgba(255,255,255,.07)";
      ctx.fillRect(0, groundY, w, 2);

      ctx.save();
      ctx.translate(w / 2, groundY);
      ctx.scale(sc, sc);
      zeichneAtelierHund(ctx, o.id, {
        ansicht: o.face === 1 ? "rechts" : "links",
        pose: mapPose(o.pose),
        zeit: t,
      });
      ctx.restore();
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0" />;
}

/** Vergleichsbuehne: Ursprungsfigur und aufgehuebschte Version synchron im selben Massstab nebeneinander. */
export function HundVergleichStage({
  id,
  pose,
  face,
  zoom,
  paused,
  speed,
}: {
  id: HundId;
  pose: HundPose;
  face: 1 | -1;
  zoom: number;
  paused: boolean;
  speed: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const p = useRef({ id, pose, face, zoom, paused, speed });
  p.current = { id, pose, face, zoom, paused, speed };

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let t = 0;
    let gang = 0;
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
      if (o.pose === "walk") gang += dt * 6.5;
      else if (o.pose === "trot") gang += dt * 11;
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

      // Raumhintergrund
      ctx.fillStyle = "#101c22";
      ctx.fillRect(0, 0, w, h);

      const groundY = h * 0.82;
      const sc = o.zoom;

      ctx.fillStyle = "#1a3038";
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = "rgba(255,255,255,.07)";
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

      const lx = w * 0.27;
      const rx = w * 0.73;

      // Schulterhoehe als Referenzlinie
      const schulter = o.id === "apollo" ? 29.6 : 29.4;
      ctx.strokeStyle = "rgba(255,182,72,.35)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, groundY - schulter * sc);
      ctx.lineTo(w, groundY - schulter * sc);
      ctx.stroke();
      ctx.setLineDash([]);

      // Links: Ursprung im Spiel
      drawHund(ctx, o.id, lx, groundY, {
        t,
        face: o.face,
        pose: o.pose,
        gang,
        blinzeln: blink > 0,
        scale: sc,
        shadow: true,
      });

      // Rechts: Aufgehuebscht
      ctx.save();
      ctx.translate(rx, groundY);
      ctx.scale(sc, sc);
      zeichneAtelierHund(ctx, o.id, {
        ansicht: o.face === 1 ? "rechts" : "links",
        pose: mapPose(o.pose),
        zeit: t,
      });
      ctx.restore();

      ctx.font = '600 11px "Space Grotesk", sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(238,247,242,.85)";
      ctx.fillText("Ursprung (im Spiel)", lx, h - 14);
      ctx.fillStyle = "rgba(255,182,72,.95)";
      ctx.fillText("Aufgehübscht (Feinzeichnung)", rx, h - 14);
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,182,72,.75)";
      ctx.font = '600 10px "Space Grotesk", sans-serif';
      ctx.fillText(`beide Schulterhöhe ${schulter.toFixed(1)} Einheiten · ${Math.round(schulter * sc)} px`, 10, groundY - schulter * sc - 6);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0" />;
}
