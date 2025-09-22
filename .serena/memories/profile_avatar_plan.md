Planned feature: user avatar change.
- UI: Add AvatarUploader on /settings/profile with preview, upload, save.
- Upload: Reuse /api/images/local-upload; add /api/images/upload-token for uniform client helper.
- Server action: updateAvatarAction(url) sets users.image and revalidates /me and /profile/[username].
- Display: ProfileHeader already uses user.image.
- Constraints: accept image/* up to 2MB; client-side validation; keep files in public/uploads in dev.
