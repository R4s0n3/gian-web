import { z } from "zod";

import { MAX_HERO_IMAGES } from "@/app/_lib/content-shared";
import { isPortfolioPdfKey, MAX_PORTFOLIO_PDF_SIZE } from "@/lib/portfolio";

const heroImageSchema = z.object({
  url: z.string().trim().min(1).max(500),
  alt: z.string().trim().min(1).max(250),
});

export const siteSettingsUpdateSchema = z.object({
  heroImages: z.array(heroImageSchema).max(MAX_HERO_IMAGES),
});

const pdfFileNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/\.pdf$/i);

export const portfolioUploadSchema = z.object({
  fileName: pdfFileNameSchema,
  size: z.number().int().min(1).max(MAX_PORTFOLIO_PDF_SIZE),
});

export const portfolioSaveSchema = z.object({
  key: z.string().refine(isPortfolioPdfKey, "Ungültiger PDF-Schlüssel"),
  fileName: pdfFileNameSchema,
});
