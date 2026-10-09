import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "arrow-right"
  | "bell"
  | "calendar"
  | "chart"
  | "coins"
  | "file"
  | "hand-coins"
  | "home"
  | "menu"
  | "settings"
  | "sparkles"
  | "users"
  | "wallet";

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: IconName;
  size?: number;
};

const paths: Record<IconName, ReactNode> = {
  "arrow-right": <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
  coins: <><ellipse cx="8" cy="7" rx="5" ry="3"/><path d="M3 7v4c0 1.7 2.2 3 5 3s5-1.3 5-3V7M6 14v3c0 1.7 2.2 3 5 3s5-1.3 5-3v-4"/><path d="M13 10c2.8 0 5 1.3 5 3"/></>,
  file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 13h6M9 17h6"/></>,
  "hand-coins": <><circle cx="16" cy="7" r="3"/><path d="M3 13h4l3 3h4.5a2 2 0 0 1 0 4H9l-4-3H3z"/><path d="M13 12h4l4 3"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  sparkles: <><path d="m12 3 1.1 3.2L16 8l-2.9 1.8L12 13l-1.1-3.2L8 8l2.9-1.8z"/><path d="m5 14 .8 2.2L8 17.5l-2.2 1.3L5 21l-.8-2.2L2 17.5l2.2-1.3zM19 12l.6 1.6 1.4.9-1.4.9L19 17l-.6-1.6-1.4-.9 1.4-.9z"/></>,
  users: <><circle cx="9" cy="8" r="4"/><path d="M2 21v-2a6 6 0 0 1 12 0v2M16 4a4 4 0 0 1 0 8M17 15a5 5 0 0 1 5 5v1"/></>,
  wallet: <><path d="M4 5h14a2 2 0 0 1 2 2v12H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M16 10h6v5h-6a2.5 2.5 0 0 1 0-5ZM6 5V3h11"/></>,
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

