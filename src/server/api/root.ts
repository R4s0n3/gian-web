import { bookingRouter } from "@/server/api/routers/booking";
import { checkoutRouter } from "@/server/api/routers/checkout";
import { galleryRouter } from "@/server/api/routers/gallery";
import { orderRouter } from "@/server/api/routers/order";
import { productRouter } from "@/server/api/routers/product";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  booking: bookingRouter,
  checkout: checkoutRouter,
  gallery: galleryRouter,
  order: orderRouter,
  product: productRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.gallery.publicList();
 *       ^? GalleryPost[]
 */
export const createCaller = createCallerFactory(appRouter);
