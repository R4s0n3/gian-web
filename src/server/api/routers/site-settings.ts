import { TRPCError } from "@trpc/server";

import { normalizePublicSiteSettings } from "@/app/_lib/content-shared";
import {
  portfolioSaveSchema,
  portfolioUploadSchema,
  siteSettingsUpdateSchema,
} from "@/server/api/routers/site-settings-schema";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import {
  createR2PortfolioUpload,
  R2ConfigurationError,
  verifyR2PortfolioPdf,
} from "@/server/r2";

const PRIMARY_SETTINGS_ID = "primary";
const siteSettingsSelect = {
  heroImages: true,
  heroImageUrl: true,
  heroImageAlt: true,
  portfolioPdfKey: true,
  portfolioPdfName: true,
} as const;

async function portfolioStorageOperation<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof R2ConfigurationError) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Der Dateispeicher ist nicht korrekt konfiguriert.",
        cause: error,
      });
    }
    if (error instanceof TypeError) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    }
    console.error("Portfolio storage operation failed", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Die PDF konnte nicht im Dateispeicher verarbeitet werden.",
      cause: error,
    });
  }
}

export const siteSettingsRouter = createTRPCRouter({
  publicGet: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.siteSettings.findUnique({
      where: { id: PRIMARY_SETTINGS_ID },
      select: siteSettingsSelect,
    });

    return normalizePublicSiteSettings(settings);
  }),

  adminGet: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.siteSettings.findUnique({
      where: { id: PRIMARY_SETTINGS_ID },
      select: siteSettingsSelect,
    });

    return normalizePublicSiteSettings(settings);
  }),

  update: adminProcedure
    .input(siteSettingsUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const firstImage = input.heroImages[0];
      const settings = await ctx.db.siteSettings.upsert({
        where: { id: PRIMARY_SETTINGS_ID },
        create: {
          id: PRIMARY_SETTINGS_ID,
          heroImages: input.heroImages,
          heroImageUrl: firstImage?.url ?? null,
          heroImageAlt: firstImage?.alt ?? null,
        },
        update: {
          heroImages: input.heroImages,
          heroImageUrl: firstImage?.url ?? null,
          heroImageAlt: firstImage?.alt ?? null,
        },
        select: siteSettingsSelect,
      });

      return normalizePublicSiteSettings(settings);
    }),
  createPortfolioUpload: adminProcedure
    .input(portfolioUploadSchema)
    .mutation(() => portfolioStorageOperation(createR2PortfolioUpload)),

  savePortfolio: adminProcedure
    .input(portfolioSaveSchema)
    .mutation(async ({ ctx, input }) => {
      await portfolioStorageOperation(() => verifyR2PortfolioPdf(input.key));
      const data = {
        portfolioPdfKey: input.key,
        portfolioPdfName: input.fileName,
      };
      const settings = await ctx.db.siteSettings.upsert({
        where: { id: PRIMARY_SETTINGS_ID },
        create: { id: PRIMARY_SETTINGS_ID, ...data },
        update: data,
        select: siteSettingsSelect,
      });
      return normalizePublicSiteSettings(settings);
    }),

  removePortfolio: adminProcedure.mutation(async ({ ctx }) => {
    await ctx.db.siteSettings.updateMany({
      where: { id: PRIMARY_SETTINGS_ID },
      data: { portfolioPdfKey: null, portfolioPdfName: null },
    });
    return { success: true };
  }),
});
