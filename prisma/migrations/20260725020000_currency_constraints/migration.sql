-- Tighten currency constraints to structurally valid ISO-style codes.
ALTER TABLE "Product"
    DROP CONSTRAINT "Product_currency_check",
    ADD CONSTRAINT "Product_currency_check"
        CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "Order"
    DROP CONSTRAINT "Order_currency_check",
    ADD CONSTRAINT "Order_currency_check"
        CHECK ("currency" ~ '^[A-Z]{3}$');
