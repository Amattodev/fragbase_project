import 'client-only';

export type Post = {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  slug: string;
  createdAt: number;
  updatedAt: number;
  tags: { id: number; name: string; norm: string }[];
  gameCategories: { id: number; name: string; displayName: string }[];
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

export type ListResponse = {
  ok: boolean;
  posts?: Post[];
  pagination?: { limit: number; offset: number; hasMore: boolean; total?: number };
  error?: string;
};
export type SingleResponse = { ok: boolean; post?: Post; error?: string };
