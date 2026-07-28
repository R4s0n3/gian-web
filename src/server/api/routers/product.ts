import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Verwende Kleinbuchstaben, Zahlen und Bindestriche",
  );
const currencySchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.literal("EUR", { errorMap: () => ({ message: "Verwende EUR" }) }));

const productFields = {
  slug: slugSchema,
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(20_000).nullish(),
  imageUrl: z.string().trim().max(500).nullish(),
  priceCents: z.number().int().positive().max(100_000_000),
  currency: currencySchema,
  active: z.boolean(),
  inventory: z.number().int().nonnegative().nullish(),
  sortOrder: z.number().int().min(-10_000).max(10_000),
} satisfies z.ZodRawShape;

const createProductSchema = z.object({
  ...productFields,
  currency: productFields.currency.default("EUR"),
  active: productFields.active.default(true),
  sortOrder: productFields.sortOrder.default(0),
});

const updateProductSchema = z
  .object({
    id: z.string().cuid(),
    slug: productFields.slug.optional(),
    name: productFields.name.optional(),
    description: productFields.description,
    imageUrl: productFields.imageUrl,
    priceCents: productFields.priceCents.optional(),
    currency: productFields.currency.optional(),
    active: productFields.active.optional(),
    inventory: productFields.inventory,
    sortOrder: productFields.sortOrder.optional(),
  })
  .refine(
    ({ id: _id, ...changes }) =>
      Object.values(changes).some((value) => value !== undefined),
    { message: "Mindestens ein Feld muss aktualisiert werden" },
  );

const productOrderBy = [
  { sortOrder: "asc" as const },
  { createdAt: "desc" as const },
];

export const productRouter = createTRPCRouter({
  publicList: publicProcedure.query(({ ctx }) =>
    ctx.db.product.findMany({
      where: { active: true },
      orderBy: productOrderBy,
    }),
  ),

  adminList: adminProcedure.query(({ ctx }) =>
    ctx.db.product.findMany({
      orderBy: [{ active: "desc" }, ...productOrderBy],
    }),
  ),

  create: adminProcedure
    .input(createProductSchema)
    .mutation(({ ctx, input }) => ctx.db.product.create({ data: input })),

  update: adminProcedure
    .input(updateProductSchema)
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.product.update({ where: { id }, data });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(({ ctx, input }) =>
      ctx.db.product.delete({ where: { id: input.id } }),
    ),
});
