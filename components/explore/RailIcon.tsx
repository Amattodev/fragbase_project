"use client";
import type { MouseEventHandler } from "react";
import GameIconImage from "../common/GameIconImage";

export type RailIconProps = {
  slug: string;
  name: string;
  active?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

// 丸型ゲームアイコン + 下にラベル
export function RailIcon({ slug, name, active = false, onClick }: RailIconProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={name}
      title={name}
      onClick={onClick}
      className={`group flex w-[72px] flex-col items-center gap-1 rounded-md p-2 outline-none transition-colors
        ${active ? "bg-[var(--color-surface)]" : "hover:bg-[var(--color-surface-hover)]"}`}
    >
      <GameIconImage slug={slug} name={name} size={56} active={active} />
      <span className={`line-clamp-1 w-full text-center text-xs ${active ? "font-medium" : "text-muted-foreground"}`}>
        {name}
      </span>
    </button>
  );
}

export default RailIcon;
