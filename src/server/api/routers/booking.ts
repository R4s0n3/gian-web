import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import {
  anonymizedRateLimitKey,
  consumeRateLimit,
  requesterIp,
} from "@/server/rate-limit";

export const bookingStatuses = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

const bookingTransitions = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
} as const satisfies Record<
  (typeof bookingStatuses)[number],
  readonly (typeof bookingStatuses)[number][]
>;

const createBookingSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).nullish(),
  service: z.string().trim().min(1).max(160),
  startAt: z
    .union([z.date(), z.string().datetime({ offset: true })])
    .transform((value) => (value instanceof Date ? value : new Date(value))),
  durationMinutes: z
    .number()
    .int()
    .min(30)
    .max(8 * 60)
    .default(120),
  notes: z.string().trim().max(10_000).nullish(),
});

const PENDING_REQUEST_LIMIT = 3;
const PENDING_REQUEST_WINDOW_MS = 24 * 60 * 60 * 1_000;
const IP_REQUEST_LIMIT = 10;
const IP_REQUEST_WINDOW_MS = 60 * 60 * 1_000;

function isSerializableConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

export const bookingRouter = createTRPCRouter({
  create: publicProcedure
    .input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      if (input.startAt <= now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please choose a future appointment time",
        });
      }

      const ip = requesterIp(ctx.headers);
      if (ip) {
        const ipLimit = consumeRateLimit({
          key: anonymizedRateLimitKey("booking-ip", ip),
          limit: IP_REQUEST_LIMIT,
          windowMs: IP_REQUEST_WINDOW_MS,
        });
        if (!ipLimit.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Too many booking requests. Try again in ${ipLimit.retryAfterSeconds} seconds.`,
          });
        }
      }

      const email = input.email.toLowerCase();
      const requestedEnd = new Date(
        input.startAt.getTime() + input.durationMinutes * 60_000,
      );
      const pendingWindowStart = new Date(
        now.getTime() - PENDING_REQUEST_WINDOW_MS,
      );

      const createBooking = () =>
        ctx.db.$transaction(
          async (tx) => {
            const pendingRequestCount = await tx.booking.count({
              where: {
                email,
                status: "PENDING",
                createdAt: { gte: pendingWindowStart },
              },
            });
            if (pendingRequestCount >= PENDING_REQUEST_LIMIT) {
              throw new TRPCError({
                code: "TOO_MANY_REQUESTS",
                message:
                  "You already have three pending requests. Please wait for the studio to respond.",
              });
            }

            const possibleConflicts = await tx.booking.findMany({
              where: {
                status: "CONFIRMED",
                startAt: { lt: requestedEnd },
              },
              select: {
                startAt: true,
                durationMinutes: true,
              },
            });

            const overlaps = possibleConflicts.some((booking) => {
              const existingEnd =
                booking.startAt.getTime() + booking.durationMinutes * 60_000;
              return existingEnd > input.startAt.getTime();
            });

            if (overlaps) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "That appointment time is no longer available",
              });
            }

            return tx.booking.create({
              data: {
                ...input,
                email,
              },
            });
          },
          { isolationLevel: "Serializable" },
        );

      try {
        return await createBooking();
      } catch (error) {
        if (isSerializableConflict(error)) {
          try {
            return await createBooking();
          } catch (retryError) {
            if (isSerializableConflict(retryError)) {
              throw new TRPCError({
                code: "CONFLICT",
                message:
                  "Another booking request was submitted at the same time. Please try again.",
              });
            }
            throw retryError;
          }
        }
        throw error;
      }
    }),

  adminList: adminProcedure.query(({ ctx }) =>
    ctx.db.booking.findMany({
      orderBy: [{ startAt: "asc" }, { createdAt: "desc" }],
    }),
  ),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        status: z.enum(bookingStatuses),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updateBooking = () =>
        ctx.db.$transaction(
          async (tx) => {
            const booking = await tx.booking.findUniqueOrThrow({
              where: { id: input.id },
            });
            if (booking.status === input.status) return booking;

            const allowedStatuses: readonly string[] =
              bookingTransitions[booking.status];
            if (!allowedStatuses.includes(input.status)) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Booking cannot move from ${booking.status} to ${input.status}`,
              });
            }

            if (input.status === "CONFIRMED") {
              const bookingEnd = new Date(
                booking.startAt.getTime() + booking.durationMinutes * 60_000,
              );
              const possibleConflicts = await tx.booking.findMany({
                where: {
                  id: { not: booking.id },
                  status: "CONFIRMED",
                  startAt: { lt: bookingEnd },
                },
                select: { startAt: true, durationMinutes: true },
              });
              const overlaps = possibleConflicts.some(
                (other) =>
                  other.startAt.getTime() + other.durationMinutes * 60_000 >
                  booking.startAt.getTime(),
              );

              if (overlaps) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message:
                    "Another confirmed booking already occupies that time slot",
                });
              }
            }

            return tx.booking.update({
              where: { id: booking.id, status: booking.status },
              data: { status: input.status },
            });
          },
          { isolationLevel: "Serializable" },
        );

      try {
        return await updateBooking();
      } catch (error) {
        if (isSerializableConflict(error)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Booking state changed concurrently. Please try again.",
          });
        }
        throw error;
      }
    }),
});
