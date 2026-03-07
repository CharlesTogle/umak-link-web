import { api } from "@/lib/api";

export type StorageBucket = "items" | "profilePictures";

interface SignedUploadUrlResponse {
  uploadUrl: string;
  objectPath: string;
  publicUrl: string;
}

interface ConfirmUploadResponse {
  success: boolean;
}

export async function getSignedUploadUrl(
  bucket: StorageBucket,
  fileName: string,
  contentType: string
): Promise<SignedUploadUrlResponse> {
  const { data } = await api.post<SignedUploadUrlResponse>("/storage/upload-url", {
    bucket,
    fileName,
    contentType,
  });
  return data;
}

export async function confirmUpload(bucket: StorageBucket, objectPath: string): Promise<boolean> {
  const { data } = await api.post<ConfirmUploadResponse>("/storage/confirm-upload", {
    bucket,
    objectPath,
  });
  return data.success;
}

export async function uploadAndGetPublicUrl(
  bucket: StorageBucket,
  path: string,
  file: File
): Promise<string> {
  // Get signed upload URL from backend
  const uploadData = await getSignedUploadUrl(bucket, path, file.type || "image/jpeg");

  // Upload directly to Supabase Storage using signed URL
  const uploadRes = await fetch(uploadData.uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "image/jpeg",
    },
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed: ${uploadRes.statusText}`);
  }

  // Confirm upload with backend
  await confirmUpload(bucket, uploadData.objectPath);

  return uploadData.publicUrl;
}

export async function deleteStorageObject(bucket: StorageBucket, objectPath: string): Promise<boolean> {
  const { data } = await api.delete<{ success: boolean }>("/storage", {
    data: { bucket, objectPath },
  });
  return data.success;
}
