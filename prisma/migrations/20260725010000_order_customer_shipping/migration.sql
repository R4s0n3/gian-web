-- AlterTable
ALTER TABLE "Order"
    ADD COLUMN "customerName" VARCHAR(160),
    ADD COLUMN "shippingAddress" JSONB,
    ADD COLUMN "shippingPhone" VARCHAR(40);

-- Throttle/status lookup indexes
CREATE INDEX "Order_email_status_createdAt_idx"
    ON "Order"("email", "status", "createdAt");

CREATE INDEX "Booking_email_status_createdAt_idx"
    ON "Booking"("email", "status", "createdAt");
