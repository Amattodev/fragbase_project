import type { SVGProps } from "react";

export default function SteamIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="img"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12l-3 2.3" />
      <circle cx="15" cy="10" r="2.2" />
      <circle cx="7.4" cy="16.2" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="7.4" cy="16.2" r="2" />
    </svg>
  );
}

