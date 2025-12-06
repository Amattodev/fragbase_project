import { useCallback, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GameProfileFormInnerProps } from "./types";

type Props = GameProfileFormInnerProps;

export function DefaultGameProfileForm({ mode, initial, onSave, onDelete }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [chars, setChars] = useState<string[]>(() => {
    const base = initial?.mainCharacters && initial.mainCharacters.length > 0 ? initial.mainCharacters : ["", "", ""];
    return base;
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.delete("mainCharacters[]");
    chars
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
      .forEach((c) => fd.append("mainCharacters[]", c));
    start(async () => {
      try {
        const res = await onSave(fd);
        window.location.href = res.redirect;
      } catch (err: any) {
        setError(err?.message || "Failed to save");
      }
    });
  }

  function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Delete this game profile?")) return;
    start(async () => {
      try {
        const res = await onDelete();
        window.location.href = res.redirect;
      } catch (err: any) {
        setError(err?.message || "Failed to delete");
      }
    });
  }

  const dragIndex = useRef<number | null>(null);
  const onDragStart = useCallback(
    (idx: number) => (e: React.DragEvent) => {
      dragIndex.current = idx;
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );
  const onDragOver = useCallback(
    (idx: number) => (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    [],
  );
  const onDrop = useCallback(
    (idx: number) => (e: React.DragEvent) => {
      e.preventDefault();
      const from = dragIndex.current;
      dragIndex.current = null;
      if (from == null || from === idx) return;
      setChars((prev) => {
        const arr = prev.slice();
        const [moved] = arr.splice(from, 1);
        arr.splice(idx, 0, moved);
        return arr;
      });
    },
    [],
  );

  function addRow() {
    setChars((prev) => [...prev, ""]);
  }

  function removeRow(idx: number) {
    setChars((prev) => {
      if (prev.length === 1) return prev; // keep at least one row visible
      return prev.filter((_, i) => i !== idx);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="現ランク (Current Rank)" name="currentRank" defaultValue={initial?.currentRank} />
        <Field label="最高ランク (Highest Rank)" name="highestRank" defaultValue={initial?.highestRank} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="ゲームアカウントID" name="accountId" defaultValue={initial?.accountId} />
        <Field label="ゲーム内ユーザー名" name="accountUsername" defaultValue={initial?.accountUsername} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">メインキャラクター（制限なし、ドラッグで並び替え）</label>
        <ul className="space-y-2">
          {chars.map((val, i) => (
            <li
              key={i}
              draggable
              onDragStart={onDragStart(i)}
              onDragOver={onDragOver(i)}
              onDrop={onDrop(i)}
              className="flex items-center gap-3 rounded border bg-background px-3 py-2"
            >
              <span className="w-5 select-none text-center text-xs text-muted-foreground">{i + 1}</span>
              <span className="cursor-move select-none text-muted-foreground">⋮⋮</span>
              <input
                className="flex-1 bg-transparent outline-none"
                name="mainCharacters[]"
                value={val}
                onChange={(e) => {
                  const v = e.target.value;
                  setChars((prev) => prev.map((p, idx) => (idx === i ? v : p)));
                }}
                placeholder="キャラクター名"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => removeRow(i)}
                disabled={chars.length === 1}
              >
                削除
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            行を追加
          </Button>
          <p className="text-xs text-muted-foreground">未入力は保存時に無視されます。上から使用頻度が高い順です。</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : mode === "create" ? "Save" : "Save Changes"}
        </Button>
        {mode === "edit" && onDelete && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
            Delete Profile
          </Button>
        )}
      </div>
    </form>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <Input id={name} name={name} defaultValue={defaultValue} placeholder={placeholder} />
    </div>
  );
}
