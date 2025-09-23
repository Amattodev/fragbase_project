export function mapRowWithParsedMainCharacters<T extends { mainCharacters?: string | null }>(
  row: T,
): Omit<T, 'mainCharacters'> & { mainCharacters?: string[] | null } {
  let parsed: string[] | null = null;
  if (row.mainCharacters) {
    try {
      const arr = JSON.parse(row.mainCharacters);
      if (Array.isArray(arr)) parsed = arr.filter((x) => typeof x === 'string').slice(0, 3);
    } catch {}
  }
  return { ...(row as any), mainCharacters: parsed };
}

export function stringifyMainCharacters(arr?: string[] | null): string | null {
  if (!arr || arr.length === 0) return null;
  const clean = arr.filter((x) => typeof x === 'string' && x.trim().length > 0).slice(0, 3);
  return clean.length ? JSON.stringify(clean) : null;
}

