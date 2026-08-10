import { z } from "zod";

import { MAX_HERO_IMAGES } from "@/app/_lib/content-shared";

const heroImageSchema = z.object({
  url: z.string().trim().min(1).max(500),
  alt: z.string().trim().min(1).max(250),
});

export const siteSettingsUpdateSchema = z.object({
  heroImages: z.array(heroImageSchema).max(MAX_HERO_IMAGES),
});
