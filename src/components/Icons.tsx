import type { ReactElement, SVGProps } from "react";

/**
 * UI-Icons als Inline-SVG. Das Haus braucht derzeit nur den Ton-Schalter;
 * weitere Icons bei Bedarf hier ergänzen (24x24-Viewbox, currentColor).
 */
export type UiIcon = "sound" | "mute";

const P: Record<UiIcon, ReactElement> = {
  sound: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z" />
      <path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </>
  ),
  mute: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z" />
      <path d="m16 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
};

interface Props extends SVGProps<SVGSVGElement> {
  name: UiIcon;
  size?: number;
}

export function Icon({ name, size = 16, className, ...rest }: Props) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true" {...rest}>
      {P[name]}
    </svg>
  );
}
