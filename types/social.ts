import type { ComponentType } from "react";
import { Link as LinkIcon } from "lucide-react";
import DiscordIcon from "@/types/icons/DiscordIcon";
import SteamIcon from "@/types/icons/SteamIcon";
import TikTokIcon from "@/types/icons/TikTokIcon";
import TwitchIcon from "@/types/icons/TwitchIcon";
import XIcon from "@/types/icons/XIcon";
import YoutubeIcon from "@/types/icons/YoutubeIcon";

export type SocialKey = "x" | "youtube" | "twitch" | "tiktok" | "steam" | "discord" | (string & {});

export type SocialMeta = {
  key: SocialKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  aliases?: string[];
};

export const SOCIALS: Record<string, SocialMeta> = {
  x: { key: "x", label: "X", icon: XIcon, aliases: ["twitter"] },
  youtube: { key: "youtube", label: "YouTube", icon: YoutubeIcon },
  twitch: { key: "twitch", label: "Twitch", icon: TwitchIcon },
  tiktok: { key: "tiktok", label: "TikTok", icon: TikTokIcon },
  steam: { key: "steam", label: "Steam", icon: SteamIcon },
  discord: { key: "discord", label: "Discord", icon: DiscordIcon },
};

// フォールバック用の汎用リンクアイコン
export const FALLBACK_SOCIAL_ICON = LinkIcon;

export const SOCIAL_ORDER: SocialKey[] = ["x", "youtube", "twitch", "tiktok", "steam", "discord"];
