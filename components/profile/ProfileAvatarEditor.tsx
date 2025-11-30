"use client";

import type { ChangeEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import Cropper, { type Area } from "react-easy-crop";

import { Button } from "@/components/ui/button";
import { updateAvatarAction } from "@/app/(actions)/profile";
import { uploadImageAndGetUrl } from "@/lib/services/uploads";

type ProfileAvatarEditorProps = {
  initialImageUrl: string | null;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

async function getCroppedImage(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create image blob"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.9,
    );
  });
}

export function ProfileAvatarEditor({ initialImageUrl }: ProfileAvatarEditorProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialImageUrl);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const { update: updateSession } = useSession();

  useEffect(() => {
    setAvatarUrl(initialImageUrl);
  }, [initialImageUrl]);

  useEffect(
    () => () => {
      if (sourceUrl && sourceUrl.startsWith("blob:")) {
        URL.revokeObjectURL(sourceUrl);
      }
    },
    [sourceUrl],
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("ファイルサイズは5MB以下にしてください");
      return;
    }

    if (sourceUrl && sourceUrl.startsWith("blob:")) {
      URL.revokeObjectURL(sourceUrl);
    }

    setError(null);
    setLocalFile(file);
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleSave = async () => {
    if (!localFile || !sourceUrl || !croppedAreaPixels || uploading || pending) return;
    setError(null);
    setUploading(true);
    try {
      const blob = await getCroppedImage(sourceUrl, croppedAreaPixels);
      const croppedFile = new File([blob], localFile.name || "avatar.jpg", {
        type: blob.type || "image/jpeg",
      });
      const { url } = await uploadImageAndGetUrl(croppedFile);
      startTransition(async () => {
        await updateAvatarAction(url);
        if (updateSession) {
          await updateSession();
        }
        setLocalFile(null);
        setSourceUrl(null);
        setAvatarUrl(url);
      });
    } catch (e) {
      console.error("Avatar update failed", e);
      setError("アイコンの更新に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setUploading(false);
    }
  };

  const isBusy = uploading || pending;

  return (
    <section className="flex w-full flex-col items-center gap-3">
      <div className="h-24 w-24 overflow-hidden rounded-full border border-border bg-muted">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="プロフィールアイコンのプレビュー" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
            No Image
          </div>
        )}
      </div>
      {sourceUrl && (
        <div className="relative mt-2 h-64 w-64 overflow-hidden rounded-xl border bg-black/60">
          <Cropper
            image={sourceUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
          />
        </div>
      )}
      {sourceUrl && (
        <div className="mt-2 flex w-64 items-center gap-2">
          <span className="text-[11px] text-muted-foreground">ズーム</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
        </div>
      )}
      <div className="flex flex-col items-center gap-2">
        <label className="cursor-pointer text-xs text-primary underline">
          画像を選択
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
        <Button
          type="button"
          size="sm"
          disabled={!localFile || !sourceUrl || !croppedAreaPixels || isBusy}
          onClick={handleSave}
        >
          {isBusy ? "更新中..." : "アイコンを保存"}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-[11px] text-muted-foreground">
        画像を選択して、下のプレビューをドラッグして丸型のトリミング位置を調整できます（推奨: 正方形 / 5MB 以内）。
      </p>
    </section>
  );
}
