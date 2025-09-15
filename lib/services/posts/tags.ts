import 'client-only';

export async function searchTags(q: string): Promise<{ id: number; name: string }[]> {
  const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}`);
  const data = (await res.json()) as { ok: boolean; tags: { id: number; name: string }[] };
  if (!data.ok) return [];
  return data.tags;
}

