import { normalizePublicSiteSettings } from "@/app/_lib/content-shared";
import { siteSettingsUpdateSchema } from "@/server/api/routers/site-settings-schema";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

const PRIMARY_SETTINGS_ID = "primary";
const heroSettingsSelect = {
  heroImages: true,
  heroImageUrl: true,
  heroImageAlt: true,
} as const;

export const siteSettingsRouter = createTRPCRouter({
  publicGet: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.siteSettings.findUnique({
      where: { id: PRIMARY_SETTINGS_ID },
      select: heroSettingsSelect,
    });

    return normalizePublicSiteSettings(settings);
  }),

  adminGet: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.siteSettings.findUnique({
      where: { id: PRIMARY_SETTINGS_ID },
      select: heroSettingsSelect,
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
        select: heroSettingsSelect,
      });

      return normalizePublicSiteSettings(settings);
    }),
});
