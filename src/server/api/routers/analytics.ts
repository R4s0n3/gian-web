import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { AnalyticsQueryError } from "@/lib/posthog-report";
import { getAnalyticsReport } from "@/server/analytics";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";

export const analyticsRouter = createTRPCRouter({
  overview: adminProcedure
    .input(
      z.object({ days: z.union([z.literal(7), z.literal(30), z.literal(90)]) }),
    )
    .query(async ({ input }) => {
      try {
        return await getAnalyticsReport(input.days);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message:
            error instanceof AnalyticsQueryError
              ? error.message
              : "Die Website-Statistik konnte nicht geladen werden.",
        });
      }
    }),
});
