import "server-only";

import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/env";
import {
  createMediaObjectKey,
  isManagedMediaKey,
  MEDIA_CACHE_CONTROL,
  MEDIA_LIST_PAGE_SIZE,
  MEDIA_PREFIX,
  MEDIA_UPLOAD_EXPIRY_SECONDS,
  publicMediaUrl,
  type MediaContentType,
} from "@/lib/media";

const r2EnvironmentNames = [
  "R2_S3_ENDPOINT",
  "R2_BUCKET_NAME",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_BASE_URL",
] as const;

type R2Configuration = {
  endpoint: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
};

type R2Storage = {
  client: S3Client;
  configuration: R2Configuration;
};

export class R2ConfigurationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "R2ConfigurationError";
  }
}

let storage: R2Storage | undefined;

function isLocalHostname(hostname: string) {
  const normalizedHostname = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "");

  return (
    normalizedHostname === "localhost" ||
    normalizedHostname.endsWith(".localhost") ||
    normalizedHostname === "::1" ||
    normalizedHostname === "0:0:0:0:0:0:0:1" ||
    normalizedHostname === "0.0.0.0" ||
    normalizedHostname.startsWith("127.")
  );
}

function normalizeEndpoint(value: string) {
  let endpoint: URL;
  try {
    endpoint = new URL(value);
  } catch (error) {
    throw new R2ConfigurationError("R2_S3_ENDPOINT is not a valid URL", {
      cause: error,
    });
  }

  if (
    endpoint.protocol !== "https:" ||
    endpoint.username ||
    endpoint.password ||
    endpoint.pathname !== "/" ||
    endpoint.search ||
    endpoint.hash
  ) {
    throw new R2ConfigurationError(
      "R2_S3_ENDPOINT must be an HTTPS origin without credentials, a path, a query, or a fragment",
    );
  }

  return endpoint.toString().replace(/\/$/, "");
}

function readR2Configuration(): R2Configuration {
  const values = {
    R2_S3_ENDPOINT: env.R2_S3_ENDPOINT,
    R2_BUCKET_NAME: env.R2_BUCKET_NAME,
    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
    R2_PUBLIC_BASE_URL: env.R2_PUBLIC_BASE_URL,
  };
  const missingNames = r2EnvironmentNames.filter((name) => !values[name]);

  if (missingNames.length > 0) {
    const configuredCount = r2EnvironmentNames.length - missingNames.length;
    const prefix =
      configuredCount === 0
        ? "Cloudflare R2 is not configured"
        : "Cloudflare R2 configuration is incomplete";
    throw new R2ConfigurationError(
      `${prefix}. Set ${missingNames.join(", ")}.`,
    );
  }

  const endpoint = normalizeEndpoint(values.R2_S3_ENDPOINT!);
  const bucketName = values.R2_BUCKET_NAME!.trim();
  const accessKeyId = values.R2_ACCESS_KEY_ID!;
  const secretAccessKey = values.R2_SECRET_ACCESS_KEY!;
  const publicBaseUrl = values.R2_PUBLIC_BASE_URL!;

  if (!bucketName) {
    throw new R2ConfigurationError("R2_BUCKET_NAME must not be empty");
  }

  try {
    const parsedPublicBaseUrl = new URL(publicBaseUrl);
    const insecurePublicBaseUrl =
      parsedPublicBaseUrl.protocol !== "https:" &&
      !(
        env.NODE_ENV !== "production" &&
        parsedPublicBaseUrl.protocol === "http:" &&
        isLocalHostname(parsedPublicBaseUrl.hostname)
      );

    if (insecurePublicBaseUrl) {
      throw new R2ConfigurationError(
        "R2_PUBLIC_BASE_URL must use HTTPS (HTTP localhost is allowed outside production)",
      );
    }

    const longestGeneratedKey = createMediaObjectKey(
      {
        fileName: "x".repeat(255),
        contentType: "image/avif",
      },
      {
        now: 0,
        uuid: "00000000-0000-0000-0000-000000000000",
      },
    );
    publicMediaUrl(publicBaseUrl, longestGeneratedKey);
  } catch (error) {
    throw new R2ConfigurationError(
      error instanceof Error ? error.message : "R2_PUBLIC_BASE_URL is invalid",
      { cause: error },
    );
  }

  return {
    endpoint,
    bucketName,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl,
  };
}

function getR2Storage() {
  if (storage) {
    return storage;
  }

  const configuration = readR2Configuration();
  storage = {
    configuration,
    client: new S3Client({
      endpoint: configuration.endpoint,
      region: "auto",
      credentials: {
        accessKeyId: configuration.accessKeyId,
        secretAccessKey: configuration.secretAccessKey,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
    }),
  };

  return storage;
}

export async function createR2MediaUpload(input: {
  key: string;
  contentType: MediaContentType;
}) {
  if (!isManagedMediaKey(input.key)) {
    throw new TypeError("Media key is invalid");
  }

  const { client, configuration } = getR2Storage();
  const command = new PutObjectCommand({
    Bucket: configuration.bucketName,
    Key: input.key,
    ContentType: input.contentType,
    CacheControl: MEDIA_CACHE_CONTROL,
  });
  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: MEDIA_UPLOAD_EXPIRY_SECONDS,
    signableHeaders: new Set(["content-type", "cache-control"]),
  });

  return {
    key: input.key,
    uploadUrl,
    publicUrl: publicMediaUrl(configuration.publicBaseUrl, input.key),
    headers: {
      "Content-Type": input.contentType,
      "Cache-Control": MEDIA_CACHE_CONTROL,
    },
  };
}

export async function listR2MediaObjects(cursor?: string) {
  const { client, configuration } = getR2Storage();
  const result = await client.send(
    new ListObjectsV2Command({
      Bucket: configuration.bucketName,
      Prefix: MEDIA_PREFIX,
      ContinuationToken: cursor,
      MaxKeys: MEDIA_LIST_PAGE_SIZE,
    }),
  );

  const items = (result.Contents ?? []).flatMap((object) => {
    if (!object.Key || !object.LastModified || !isManagedMediaKey(object.Key)) {
      return [];
    }

    try {
      return [
        {
          key: object.Key,
          publicUrl: publicMediaUrl(configuration.publicBaseUrl, object.Key),
          size: object.Size ?? 0,
          lastModified: object.LastModified,
        },
      ];
    } catch {
      return [];
    }
  });

  return {
    items,
    nextCursor:
      result.IsTruncated && result.NextContinuationToken
        ? result.NextContinuationToken
        : null,
  };
}

export async function deleteR2MediaObject(key: string) {
  if (!isManagedMediaKey(key)) {
    throw new TypeError("Media key is invalid");
  }

  const { client, configuration } = getR2Storage();
  await client.send(
    new DeleteObjectCommand({
      Bucket: configuration.bucketName,
      Key: key,
    }),
  );
}

export function getR2PublicMediaUrl(key: string) {
  if (!isManagedMediaKey(key)) {
    throw new TypeError("Media key is invalid");
  }

  return publicMediaUrl(getR2Storage().configuration.publicBaseUrl, key);
}
