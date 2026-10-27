import type { ReactElement, SVGProps } from "react";
import type { IconKey } from "@/game/engine";

export type UiIcon =
  | IconKey
  | "pause"
  | "play"
  | "sound"
  | "mute"
  | "left"
  | "right"
  | "up"
  | "hand"
  | "trophy"
  | "skull"
  | "bolt"
  | "clock"
  | "restart"
  | "key"
  | "sun"
  | "moon";

const P: Record<UiIcon, ReactElement> = {
  food: (
    <>
      <path d="M3 13h18a9 9 0 0 1-9 8 9 9 0 0 1-9-8Z" />
      <rect x="2" y="9.5" width="20" height="2.8" rx="1.4" />
      <path d="M4.5 8a7.5 7.5 0 0 1 15 0Z" />
    </>
  ),
  sleep: <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z" />,
  clean: <path d="M12 2.5c4 5.2 6.5 8 6.5 11a6.5 6.5 0 0 1-13 0c0-3 2.5-5.8 6.5-11Z" />,
  fun: (
    <>
      <path d="M4 6.5 20 3.5l-1.6 13L6.5 18Z" />
      <path d="M7 3 4.5 6.2M17 2.6 19.6 6" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </>
  ),
  social: (
    <>
      <rect x="2.5" y="4" width="19" height="13" rx="3.5" />
      <path d="M8 17l3 4.5 3-4.5Z" />
    </>
  ),
  heart: <path d="M12 21C4.5 16 2 12 2 8.6 2 5.5 4.4 3 7.5 3 9.6 3 11.2 4.2 12 5.6 12.8 4.2 14.4 3 16.5 3 19.6 3 22 5.5 22 8.6 22 12 19.5 16 12 21Z" />,
  book: <path d="M12 6.5 2.5 4v15L12 16.5 21.5 19V4Z" />,
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.6" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="2" />
    </>
  ),
  star: <path d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9Z" />,
  spark: <path d="M12 1.5c.9 6.4 3.1 8.6 9.5 9.5-6.4.9-8.6 3.1-9.5 9.5-.9-6.4-3.1-8.6-9.5-9.5 6.4-.9 8.6-3.1 9.5-9.5Z" />,
  mess: (
    <>
      <ellipse cx="12" cy="16" rx="9.5" ry="5" />
      <circle cx="8" cy="8" r="3" />
      <circle cx="15.5" cy="6" r="2.3" />
    </>
  ),
  pause: (
    <>
      <rect x="6" y="4" width="4.4" height="16" rx="1" />
      <rect x="13.6" y="4" width="4.4" height="16" rx="1" />
    </>
  ),
  play: <path d="M7 4.2 19.5 12 7 19.8Z" />,
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
  left: <path d="M15 3.5 6.5 12 15 20.5Z" />,
  right: <path d="M9 3.5 17.5 12 9 20.5Z" />,
  up: <path d="M12 4.5 21 15h-6v5H9v-5H3Z" />,
  hand: (
    <>
      <path d="M8 11V5.6a1.7 1.7 0 0 1 3.4 0V11m0-1.2V4.4a1.7 1.7 0 0 1 3.4 0v5.4m0-.6a1.7 1.7 0 0 1 3.4 0v5.6A6.8 6.8 0 0 1 11.4 21h-.9a5.6 5.6 0 0 1-5.6-5.6v-3a1.6 1.6 0 0 1 3.1-.7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
      <path d="M7 5.5H4.5V7a3.5 3.5 0 0 0 3 3.4M17 5.5h2.5V7a3.5 3.5 0 0 1-3 3.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <rect x="10.6" y="13.5" width="2.8" height="4" />
      <rect x="7" y="17.5" width="10" height="3" rx="1" />
    </>
  ),
  skull: (
    <>
      <path d="M12 2.5c5 0 8.5 3.4 8.5 8 0 3-1.4 4.7-2.8 5.7-.6.4-.9 1-.9 1.7v1.3a2.3 2.3 0 0 1-2.3 2.3h-5A2.3 2.3 0 0 1 7.2 19.2v-1.3c0-.7-.3-1.3-.9-1.7C4.9 15.2 3.5 13.5 3.5 10.5c0-4.6 3.5-8 8.5-8Z" />
      <circle cx="8.6" cy="11" r="2.1" fill="#08151a" />
      <circle cx="15.4" cy="11" r="2.1" fill="#08151a" />
    </>
  ),
  bolt: <path d="M13.5 2 4 13.5h6L9.5 22 20 10.2h-6.6Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6.8V12l3.6 2.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  restart: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20.5 3v5h-5Z" />
    </>
  ),
  key: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <rect x="5.5" y="9.5" width="2.6" height="2.4" />
      <rect x="10.7" y="9.5" width="2.6" height="2.4" />
      <rect x="15.9" y="9.5" width="2.6" height="2.4" />
      <rect x="7.5" y="13.6" width="9" height="2.2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.6" />
      <path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6M4.8 4.8l1.9 1.9M17.3 17.3l1.9 1.9M19.2 4.8l-1.9 1.9M6.7 17.3l-1.9 1.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  moon: <path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z" />,
};

interface Props extends SVGProps<SVGSVGElement> {
  name: UiIcon;
  size?: number;
}

export function Icon({ name, size = 16, className, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {P[name]}
    </svg>
  );
}
