export const MEDIA_MAX_FILE_SIZE = 20 * 1024 * 1024;
export const MEDIA_MAX_BATCH_SIZE = 20;
export const MEDIA_UPLOAD_CONCURRENCY = 3;

export const MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export type MediaMimeType = (typeof MEDIA_MIME_TYPES)[number];
type ValidMediaFile = File & { readonly type: MediaMimeType };

export const MEDIA_FILE_ACCEPT = MEDIA_MIME_TYPES.join(",");

type UploadTicket = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  headers: Record<string, string>;
};

type CreateUpload = (input: {
  fileName: string;
  contentType: MediaMimeType;
  size: number;
}) => Promise<UploadTicket>;

export function validateMediaFile(file: File): asserts file is ValidMediaFile {
  if (!MEDIA_MIME_TYPES.some((type) => type === file.type)) {
    throw new Error("Wähle ein Bild im Format JPEG, PNG, WebP, GIF oder AVIF.");
  }

  if (file.size === 0) {
    throw new Error("Die ausgewählte Datei ist leer.");
  }

  if (file.size > MEDIA_MAX_FILE_SIZE) {
    throw new Error("Bilder dürfen höchstens 20 MiB groß sein.");
  }
}

export async function uploadMediaFile(file: File, createUpload: CreateUpload) {
  validateMediaFile(file);

  const ticket = await createUpload({
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });

  const response = await fetch(ticket.uploadUrl, {
    method: "PUT",
    headers: ticket.headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error(`R2 hat den Upload abgelehnt (${response.status}).`);
  }

  return {
    key: ticket.key,
    publicUrl: ticket.publicUrl,
  };
}

export function mediaErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Das Bild konnte nicht hochgeladen werden. Bitte versuche es erneut.";
}
