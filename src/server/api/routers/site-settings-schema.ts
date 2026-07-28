import { z } from "zod";

export const siteSettingsUpdateSchema = z
  .object({
    heroImageUrl: z.string().trim().min(1).max(500).nullable(),
    heroImageAlt: z.string().trim().min(1).max(250).nullable(),
  })
  .superRefine((settings, ctx) => {
    if ((settings.heroImageUrl === null) !== (settings.heroImageAlt === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hero-Bild und Alternativtext müssen gemeinsam gesetzt werden",
        path:
          settings.heroImageUrl === null ? ["heroImageUrl"] : ["heroImageAlt"],
      });
    }
  });
