import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

const currentYear = new Date().getUTCFullYear();
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Verwende Kleinbuchstaben, Zahlen und Bindestriche",
  );

const galleryImageSchema = z.object({
  url: z.string().trim().min(1).max(500),
  alt: z.string().trim().min(1).max(250),
});

const galleryCategorySchema = z.enum(["PAINTING", "PHOTOGRAPHY", "COMMISSION"]);

const galleryFields = {
  title: z.string().trim().min(1).max(160),
  slug: slugSchema,
  category: galleryCategorySchema,
  excerpt: z.string().trim().max(320).nullish(),
  description: z.string().trim().max(20_000).nullish(),
  imageUrl: z.string().trim().min(1).max(500),
  imageAlt: z.string().trim().min(1).max(250),
  images: z.array(galleryImageSchema).max(30),
  medium: z.string().trim().max(160).nullish(),
  dimensions: z.string().trim().max(120).nullish(),
  year: z
    .number()
    .int()
    .min(1000)
    .max(currentYear + 1)
    .nullish(),
  featured: z.boolean(),
  published: z.boolean(),
  sortOrder: z.number().int().min(-10_000).max(10_000),
} satisfies z.ZodRawShape;

const createGalleryPostSchema = z.object({
  ...galleryFields,
  category: galleryFields.category.default("PAINTING"),
  featured: galleryFields.featured.default(false),
  published: galleryFields.published.default(false),
  sortOrder: galleryFields.sortOrder.default(0),
  images: galleryFields.images.default([]),
});

const updateGalleryPostSchema = z
  .object({
    id: z.string().cuid(),
    title: galleryFields.title.optional(),
    slug: galleryFields.slug.optional(),
    category: galleryFields.category.optional(),
    excerpt: galleryFields.excerpt,
    description: galleryFields.description,
    imageUrl: galleryFields.imageUrl.optional(),
    imageAlt: galleryFields.imageAlt.optional(),
    images: galleryFields.images.optional(),
    medium: galleryFields.medium,
    dimensions: galleryFields.dimensions,
    year: galleryFields.year,
    featured: galleryFields.featured.optional(),
    published: galleryFields.published.optional(),
    sortOrder: galleryFields.sortOrder.optional(),
  })
  .refine(
    ({ id: _id, ...changes }) =>
      Object.values(changes).some((value) => value !== undefined),
    { message: "Mindestens ein Feld muss aktualisiert werden" },
  );

const galleryOrderBy = [
  { featured: "desc" as const },
  { sortOrder: "asc" as const },
  { publishedAt: "desc" as const },
  { createdAt: "desc" as const },
];

export const galleryRouter = createTRPCRouter({
  publicList: publicProcedure
    .input(
      z
        .object({
          category: galleryCategorySchema.optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) =>
      ctx.db.galleryPost.findMany({
        where: {
          published: true,
          ...(input?.category === undefined
            ? {}
            : { category: input.category }),
        },
        orderBy: galleryOrderBy,
      }),
    ),

  adminList: adminProcedure.query(({ ctx }) =>
    ctx.db.galleryPost.findMany({
      orderBy: [{ published: "desc" }, ...galleryOrderBy],
    }),
  ),

  create: adminProcedure
    .input(createGalleryPostSchema)
    .mutation(({ ctx, input }) =>
      ctx.db.galleryPost.create({
        data: {
          ...input,
          publishedAt: input.published ? new Date() : null,
        },
      }),
    ),

  update: adminProcedure
    .input(updateGalleryPostSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const current =
        data.published === undefined
          ? null
          : await ctx.db.galleryPost.findUniqueOrThrow({
              where: { id },
              select: { published: true, publishedAt: true },
            });

      return ctx.db.galleryPost.update({
        where: { id },
        data: {
          ...data,
          publishedAt:
            data.published === true
              ? current?.published
                ? current.publishedAt
                : new Date()
              : data.published === false
                ? null
                : undefined,
        },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(({ ctx, input }) =>
      ctx.db.galleryPost.delete({ where: { id: input.id } }),
    ),
});
