import type { ComponentType } from "react";
import { Twitter, Youtube, Twitch, Link as LinkIcon } from "lucide-react";
import DiscordIcon from "@/types/icons/DiscordIcon";
import SteamIcon from "@/types/icons/SteamIcon";

export type SocialKey = "x" | "youtube" | "twitch" | "steam" | "discord" | (string & {});

export type SocialMeta = {
  key: SocialKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  aliases?: string[];
};

export const SOCIALS: Record<string, SocialMeta> = {
  x: { key: "x", label: "X", icon: Twitter, aliases: ["twitter"] },
  youtube: { key: "youtube", label: "YouTube", icon: Youtube },
  twitch: { key: "twitch", label: "Twitch", icon: Twitch },
  steam: { key: "steam", label: "Steam", icon: SteamIcon },
  discord: { key: "discord", label: "Discord", icon: DiscordIcon },
};

// フォールバック用の汎用リンクアイコン
export const FALLBACK_SOCIAL_ICON = LinkIcon;

export const SOCIAL_ORDER: SocialKey[] = ["x", "youtube", "twitch", "steam", "discord"];
