export type GameProfileInitial = Partial<{
  currentRank: string;
  highestRank: string;
  accountId: string;
  accountUsername: string;
  mainCharacters: string[];
  notes: string;
}>;

export type GameProfileFormInnerProps = {
  mode: "create" | "edit";
  slug: string;
  initial?: GameProfileInitial;
  onSave: (formData: FormData) => Promise<{ redirect: string }>;
  onDelete?: () => Promise<{ redirect: string }>;
};

