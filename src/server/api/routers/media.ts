import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createMediaObjectKey,
  isManagedMediaKey,
  MAX_MEDIA_FILE_SIZE,
  MEDIA_CONTENT_TYPES,
  validateMediaFileMetadata,
} from "@/lib/media";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import {
  createR2MediaUpload,
  deleteR2MediaObject,
  getR2PublicMediaUrl,
  listR2MediaObjects,
  R2ConfigurationError,
} from "@/server/r2";

const createUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(MEDIA_CONTENT_TYPES),
  size: z.number().int().min(1).max(MAX_MEDIA_FILE_SIZE),
});

const listSchema = z.object({
  cursor: z.string().min(1).max(4096).optional(),
});

const deleteSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(1024)
    .refine(isManagedMediaKey, "Der Medienschlüssel ist ungültig"),
});

async function runR2Operation<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    if (error instanceof R2ConfigurationError) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Der R2-Medienspeicher ist nicht korrekt konfiguriert",
        cause: error,
      });
    }

    console.error("Cloudflare R2 media operation failed", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Die Anfrage an den Medienspeicher ist fehlgeschlagen",
      cause: error,
    });
  }
}

export const mediaRouter = createTRPCRouter({
  createUpload: adminProcedure.input(createUploadSchema).mutation(({ input }) =>
    runR2Operation(async () => {
      const metadata = validateMediaFileMetadata(input);
      const key = createMediaObjectKey(metadata);

      return createR2MediaUpload({
        key,
        contentType: metadata.contentType,
      });
    }),
  ),

  list: adminProcedure
    .input(listSchema)
    .query(({ input }) =>
      runR2Operation(() => listR2MediaObjects(input.cursor)),
    ),

  delete: adminProcedure.input(deleteSchema).mutation(({ ctx, input }) =>
    runR2Operation(async () => {
      const publicUrl = getR2PublicMediaUrl(input.key);
      const [galleryReference, productReference, heroReference] =
        await Promise.all([
          ctx.db.galleryPost.findFirst({
            where: {
              OR: [
                { imageUrl: publicUrl },
                {
                  images: {
                    array_contains: [{ url: publicUrl }],
                  },
                },
              ],
            },
            select: { id: true },
          }),
          ctx.db.product.findFirst({
            where: { imageUrl: publicUrl },
            select: { id: true },
          }),
          ctx.db.siteSettings.findFirst({
            where: {
              OR: [
                { heroImageUrl: publicUrl },
                {
                  heroImages: {
                    array_contains: [{ url: publicUrl }],
                  },
                },
              ],
            },
            select: { id: true },
          }),
        ]);

      if (galleryReference || productReference || heroReference) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Dieses Bild wird noch von einem Galeriebeitrag, Produkt oder als Hero verwendet und kann nicht gelöscht werden",
        });
      }

      await deleteR2MediaObject(input.key);
      return { key: input.key };
    }),
  ),
});
