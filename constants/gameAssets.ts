export type CharacterMeta = {
  avatar?: string;
  roleKey?: string;
  roleIcon?: string;
  roleName?: string;
};

export type CharacterMetaMap = Record<string, CharacterMeta>;

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildCharacterAvatarPath(slug: string, charName: string) {
  const key = slugify(charName);
  return `/images/games/${slug}/characters/${key}.png`;
}

export function buildRoleIconPath(slug: string, roleKey: string) {
  const key = slugify(roleKey);
  return `/images/games/${slug}/roles/${key}.svg`;
}

