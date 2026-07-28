import { siteSettingsUpdateSchema } from "@/server/api/routers/site-settings-schema";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

const PRIMARY_SETTINGS_ID = "primary";
const heroSettingsSelect = {
  heroImageUrl: true,
  heroImageAlt: true,
} as const;

export const siteSettingsRouter = createTRPCRouter({
  publicGet: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.siteSettings.findUnique({
      where: { id: PRIMARY_SETTINGS_ID },
      select: heroSettingsSelect,
    });

    return (
      settings ?? {
        heroImageUrl: null,
        heroImageAlt: null,
      }
    );
  }),

  adminGet: adminProcedure.query(({ ctx }) =>
    ctx.db.siteSettings.findUnique({
      where: { id: PRIMARY_SETTINGS_ID },
      select: heroSettingsSelect,
    }),
  ),

  update: adminProcedure
    .input(siteSettingsUpdateSchema)
    .mutation(({ ctx, input }) =>
      ctx.db.siteSettings.upsert({
        where: { id: PRIMARY_SETTINGS_ID },
        create: {
          id: PRIMARY_SETTINGS_ID,
          ...input,
        },
        update: input,
        select: heroSettingsSelect,
      }),
    ),
});
