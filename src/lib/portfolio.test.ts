import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { normalizePublicSiteSettings } from "@/app/_lib/content-shared";
import {
  portfolioSaveSchema,
  portfolioUploadSchema,
} from "@/server/api/routers/site-settings-schema";
import {
  hasPdfHeader,
  isPortfolioPdfKey,
  MAX_PORTFOLIO_PDF_SIZE,
} from "./portfolio";

const key = "portfolio/12345678-1234-1234-1234-123456789abc.pdf";

void describe("portfolio PDF validation", () => {
  void test("accepts a PDF at the size limit and rejects empty, oversized and non-PDF files", () => {
    assert.equal(
      portfolioUploadSchema.safeParse({
        fileName: "Portfolio.PDF",
        size: MAX_PORTFOLIO_PDF_SIZE,
      }).success,
      true,
    );
    for (const input of [
      { fileName: "portfolio.pdf", size: 0 },
      { fileName: "portfolio.pdf", size: MAX_PORTFOLIO_PDF_SIZE + 1 },
      { fileName: "photo.jpg", size: 100 },
    ])
      assert.equal(portfolioUploadSchema.safeParse(input).success, false);
  });

  void test("confines uploads to PDF keys and rejects paths outside the portfolio namespace", () => {
    assert.equal(
      portfolioSaveSchema.safeParse({ key, fileName: "Portfolio.pdf" }).success,
      true,
    );
    for (const invalid of [
      "media/12345678-1234-1234-1234-123456789abc.pdf",
      "portfolio/../secret.pdf",
      "portfolio/file.pdf",
      `${key}?query`,
      key.replace(".pdf", ".jpg"),
    ]) {
      assert.equal(isPortfolioPdfKey(invalid), false);
      assert.equal(
        portfolioSaveSchema.safeParse({
          key: invalid,
          fileName: "portfolio.pdf",
        }).success,
        false,
      );
    }
  });

  void test("checks the file signature rather than trusting the extension", () => {
    assert.equal(hasPdfHeader(new TextEncoder().encode("%PDF-1.7")), true);
    assert.equal(hasPdfHeader(new TextEncoder().encode("<html>")), false);
    assert.equal(hasPdfHeader(new Uint8Array([0x25, 0x50])), false);
  });

  void test("publishes a complete PDF setting and hides missing or invalid settings", () => {
    const normalized = normalizePublicSiteSettings({
      portfolioPdfKey: key,
      portfolioPdfName: "My portfolio.pdf",
    });
    assert.deepEqual(normalized.portfolioPdf, {
      key,
      fileName: "My portfolio.pdf",
    });
    for (const settings of [
      null,
      { portfolioPdfKey: key },
      { portfolioPdfKey: "../file.pdf", portfolioPdfName: "Portfolio.pdf" },
    ]) {
      assert.equal(normalizePublicSiteSettings(settings).portfolioPdf, null);
    }
  });
});
