// Upload-related constants (sizes, mime types)

// Videos
export const MAX_VIDEO_FILE_SIZE = 200 * 1024 * 1024; // 200MB
export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime', // .mov
] as const;

// Public URL fallback for R2 (used in local/dev environments)
export const DEFAULT_R2_PUBLIC_URL = 'https://pub-26399b3d6caf4d29abf7fbd21e310972.r2.dev';
