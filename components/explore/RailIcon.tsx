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
      className={`group flex w-[72px] flex-col items-center gap-1 rounded-md border p-2 outline-none transition-all
        ${
          active
            ? "border-success/70 bg-card/80 shadow-[0_0_14px_rgba(123,255,74,0.35)]"
            : "border-transparent hover:border-border hover:bg-card/40"
        }`}
    >
      <GameIconImage slug={slug} name={name} size={56} active={active} />
      <span
        className={`line-clamp-2 w-full text-center text-[11px] leading-tight ${
          active ? "font-medium text-success" : "text-muted-foreground"
        }`}
      >
        {name}
      </span>
    </button>
  );
}

export default RailIcon;
