export const MEDIA_PREFIX = "media/";
export const MAX_MEDIA_FILE_SIZE = 20 * 1024 * 1024;
export const MAX_MEDIA_PUBLIC_URL_LENGTH = 500;
export const MEDIA_CACHE_CONTROL = "public, max-age=3600";
export const MEDIA_UPLOAD_EXPIRY_SECONDS = 5 * 60;
export const MEDIA_LIST_PAGE_SIZE = 48;

export const MEDIA_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export type MediaContentType = (typeof MEDIA_CONTENT_TYPES)[number];

const mediaExtensionByContentType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
} as const satisfies Record<MediaContentType, string>;

const mediaContentTypes = new Set<string>(MEDIA_CONTENT_TYPES);
const mediaFileExtensionPattern = /\.(?:avif|gif|jpe?g|png|webp)$/i;
const reverseTimestampBase = 9_999_999_999_999_999n;
const maxFileNameLength = 255;
const maxFileStemLength = 80;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type MediaFileMetadata = {
  fileName: string;
  contentType: MediaContentType;
  size: number;
};

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaValidationError";
  }
}

export function isMediaContentType(value: string): value is MediaContentType {
  return mediaContentTypes.has(value);
}

export function validateMediaFileMetadata(input: {
  fileName: string;
  contentType: string;
  size: number;
}): MediaFileMetadata {
  const fileName = input.fileName.trim();

  if (!fileName) {
    throw new MediaValidationError("File name is required");
  }

  if (fileName.length > maxFileNameLength) {
    throw new MediaValidationError(
      `File name must be at most ${maxFileNameLength} characters`,
    );
  }

  if (!isMediaContentType(input.contentType)) {
    throw new MediaValidationError(
      "Only JPEG, PNG, WebP, GIF, and AVIF images are supported",
    );
  }

  if (!Number.isSafeInteger(input.size) || input.size <= 0) {
    throw new MediaValidationError("File must not be empty");
  }

  if (input.size > MAX_MEDIA_FILE_SIZE) {
    throw new MediaValidationError("File must be 20 MiB or smaller");
  }

  return {
    fileName,
    contentType: input.contentType,
    size: input.size,
  };
}

function mediaFileStem(fileName: string) {
  const baseName = fileName.split(/[\\/]/).at(-1) ?? fileName;
  const extensionIndex = baseName.lastIndexOf(".");
  const nameWithoutExtension =
    extensionIndex > 0 ? baseName.slice(0, extensionIndex) : baseName;
  const sanitized = nameWithoutExtension
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxFileStemLength)
    .replace(/-+$/g, "");

  return sanitized || "image";
}

export function createMediaObjectKey(
  input: Pick<MediaFileMetadata, "fileName" | "contentType">,
  options: { now?: Date | number; uuid?: string } = {},
) {
  if (!isMediaContentType(input.contentType)) {
    throw new MediaValidationError(
      "Only JPEG, PNG, WebP, GIF, and AVIF images are supported",
    );
  }

  const timestamp =
    options.now instanceof Date
      ? options.now.getTime()
      : (options.now ?? Date.now());

  if (
    !Number.isSafeInteger(timestamp) ||
    timestamp < 0 ||
    timestamp > 8_640_000_000_000_000
  ) {
    throw new MediaValidationError("Upload timestamp is invalid");
  }

  const uuid = options.uuid ?? crypto.randomUUID();
  if (!uuidPattern.test(uuid)) {
    throw new MediaValidationError("Upload identifier is invalid");
  }

  const reverseTimestamp = (reverseTimestampBase - BigInt(timestamp))
    .toString()
    .padStart(16, "0");
  const readableTimestamp = new Date(timestamp)
    .toISOString()
    .replace(/\D/g, "");
  const stem = mediaFileStem(input.fileName);
  const extension = mediaExtensionByContentType[input.contentType];

  return `${MEDIA_PREFIX}${reverseTimestamp}-${readableTimestamp}-${stem}-${uuid.toLowerCase()}.${extension}`;
}

export function isManagedMediaKey(key: string) {
  if (
    key.length <= MEDIA_PREFIX.length ||
    key.length > 1024 ||
    !key.startsWith(MEDIA_PREFIX) ||
    key.includes("\0") ||
    key.includes("\\")
  ) {
    return false;
  }

  const segments = key.slice(MEDIA_PREFIX.length).split("/");
  return (
    segments.every(
      (segment) => segment !== "" && segment !== "." && segment !== "..",
    ) && mediaFileExtensionPattern.test(segments.at(-1) ?? "")
  );
}

export function publicMediaUrl(publicBaseUrl: string, key: string) {
  if (!isManagedMediaKey(key)) {
    throw new MediaValidationError("Media key is invalid");
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(publicBaseUrl);
  } catch {
    throw new MediaValidationError("R2 public base URL is invalid");
  }

  if (
    !["http:", "https:"].includes(baseUrl.protocol) ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.pathname !== "/" ||
    baseUrl.search ||
    baseUrl.hash
  ) {
    throw new MediaValidationError(
      "R2 public base URL must be an HTTP(S) origin without credentials, a path, a query, or a fragment",
    );
  }

  const normalizedBaseUrl = baseUrl.toString().replace(/\/$/, "");
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const url = `${normalizedBaseUrl}/${encodedKey}`;

  if (url.length > MAX_MEDIA_PUBLIC_URL_LENGTH) {
    throw new MediaValidationError(
      `Public media URLs must be at most ${MAX_MEDIA_PUBLIC_URL_LENGTH} characters`,
    );
  }

  return url;
}
