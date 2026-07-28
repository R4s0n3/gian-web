import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import {
  OrderOperationError,
  orderStatuses,
  updateOrderStatus,
} from "@/server/orders";

export { orderStatuses };

export const orderRouter = createTRPCRouter({
  adminList: adminProcedure.query(({ ctx }) =>
    ctx.db.order.findMany({
      include: {
        items: {
          include: { product: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        status: z.enum(orderStatuses),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await updateOrderStatus(input.id, input.status);
      } catch (error) {
        if (!(error instanceof OrderOperationError)) throw error;

        throw new TRPCError({
          code:
            error.code === "NOT_FOUND"
              ? "NOT_FOUND"
              : error.code === "PAYMENT_PENDING"
                ? "CONFLICT"
                : "BAD_REQUEST",
          message:
            error.code === "NOT_FOUND"
              ? "Bestellung nicht gefunden"
              : error.code === "PAYMENT_PENDING"
                ? "Die Zahlung wird noch verarbeitet"
                : "Diese Statusänderung ist für die Bestellung nicht möglich",
          cause: error,
        });
      }
    }),
});
