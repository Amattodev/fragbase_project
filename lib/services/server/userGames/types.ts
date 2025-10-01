export type UserGameProfile = {
  userId: string;
  gameSlug: string;
  // Legacy fields (kept for compatibility)
  rank?: string | null;
  mainRole?: string | null;
  mainCharacter?: string | null;
  platform?: string | null;
  region?: string | null;
  ingameId?: string | null;
  notes?: string | null;
  // New fields
  currentRank?: string | null;
  highestRank?: string | null;
  accountId?: string | null;
  accountUsername?: string | null;
  mainCharacters?: string[] | null; // parsed from JSON
  createdAt: number;
  updatedAt: number;
};

export type GamePlayer = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  updatedAt: number;
};

