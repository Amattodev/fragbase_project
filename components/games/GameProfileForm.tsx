"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function GameProfileForm({
  mode,
  slug,
  initial,
  onSave,
  onDelete,
}: {
  mode: 'create' | 'edit';
  slug: string;
  initial?: Partial<{ rank: string; mainRole: string; mainCharacter: string; platform: string; region: string; ingameId: string; notes: string }>;
  onSave: (formData: FormData) => Promise<{ redirect: string }>;
  onDelete?: () => Promise<{ redirect: string }>;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      try {
        const res = await onSave(fd);
        window.location.href = res.redirect;
      } catch (err: any) {
        setError(err?.message || 'Failed to save');
      }
    });
  }

  function handleDelete() {
    if (!onDelete) return;
    if (!confirm('Delete this game profile?')) return;
    start(async () => {
      try {
        const res = await onDelete();
        window.location.href = res.redirect;
      } catch (err: any) {
        setError(err?.message || 'Failed to delete');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Rank" name="rank" defaultValue={initial?.rank} />
      <Field label="Main Role" name="mainRole" defaultValue={initial?.mainRole} />
      <Field label="Main Character" name="mainCharacter" defaultValue={initial?.mainCharacter} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Platform" name="platform" defaultValue={initial?.platform} />
        <Field label="Region" name="region" defaultValue={initial?.region} />
      </div>
      <Field label="In-game ID" name="ingameId" defaultValue={initial?.ingameId} />
      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <Textarea name="notes" defaultValue={initial?.notes} rows={5} placeholder="Any additional info" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? 'Saving...' : (mode === 'create' ? 'Save' : 'Save Changes')}</Button>
        {mode === 'edit' && onDelete && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>Delete Profile</Button>
        )}
      </div>
    </form>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">{label}</label>
      <Input id={name} name={name} defaultValue={defaultValue} />
    </div>
  );
}

