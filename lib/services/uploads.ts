import 'client-only';

type UploadTokenResponse = {
  ok: boolean;
  uploadUrl?: string;
  imageId?: string;
  isLocal?: boolean;
  error?: string;
};

type CloudflareImageUploadResult = {
  success: boolean;
  result?: {
    id: string;
    variants?: string[];
  };
  errors?: unknown[];
};

type GenericUploadResult = {
  success: boolean;
  result?: { url: string; id: string };
};

export async function uploadImageAndGetUrl(file: File): Promise<{ url: string; id: string }> {
  const tokenRes = await fetch('/api/images/upload-token');
  const tokenData = (await tokenRes.json()) as UploadTokenResponse;
  if (!tokenData.ok || !tokenData.uploadUrl) {
    throw new Error(tokenData.error || 'Failed to get image upload token');
  }

  const formData = new FormData();
  formData.append('file', file);

  const uploadRes = await fetch(tokenData.uploadUrl, { method: 'POST', body: formData });
  const uploadJson = (await uploadRes.json()) as CloudflareImageUploadResult;
  if (!uploadJson.success || !uploadJson.result) {
    throw new Error('Image upload failed');
  }

  let url: string;
  const accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
  if (tokenData.isLocal && uploadJson.result.variants && uploadJson.result.variants[0]) {
    url = uploadJson.result.variants[0];
  } else if (accountHash) {
    url = `https://imagedelivery.net/${accountHash}/${uploadJson.result.id}/public`;
  } else {
    url = uploadJson.result.variants?.[0] || `/images/${uploadJson.result.id}`;
  }
  return { url, id: uploadJson.result.id };
}

export async function uploadVideoAndGetUrl(file: File): Promise<{ url: string; id: string }>
{
  const tokenRes = await fetch('/api/videos/upload-token');
  const tokenData = (await tokenRes.json()) as { ok: boolean; uploadUrl?: string; isLocal?: boolean };
  if (!tokenData.ok || !tokenData.uploadUrl) {
    throw new Error('Failed to get video upload token');
  }
  const formData = new FormData();
  formData.append('file', file);
  const uploadRes = await fetch(tokenData.uploadUrl, { method: 'POST', body: formData });
  const uploadJson = (await uploadRes.json()) as GenericUploadResult;
  if (!uploadJson.success || !uploadJson.result) {
    throw new Error('Video upload failed');
  }
  return { url: uploadJson.result.url, id: uploadJson.result.id };
}

