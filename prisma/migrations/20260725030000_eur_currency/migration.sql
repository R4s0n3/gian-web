-- Monetary amounts in this application are stored in euro cents.
ALTER TABLE "Product"
    DROP CONSTRAINT "Product_currency_check",
    ADD CONSTRAINT "Product_currency_check"
        CHECK ("currency" = 'EUR');

ALTER TABLE "Order"
    DROP CONSTRAINT "Order_currency_check",
    ADD CONSTRAINT "Order_currency_check"
        CHECK ("currency" = 'EUR');
