import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  MAX_MEDIA_FILE_SIZE,
  MAX_MEDIA_PUBLIC_URL_LENGTH,
  MEDIA_CONTENT_TYPES,
  MEDIA_PREFIX,
  MediaValidationError,
  createMediaObjectKey,
  isManagedMediaKey,
  publicMediaUrl,
  validateMediaFileMetadata,
} from "./media";

const validUuid = "12345678-1234-4abc-8def-1234567890ab";

function expectValidationError(action: () => unknown, messagePattern: RegExp) {
  assert.throws(action, (error: unknown) => {
    assert.ok(error instanceof MediaValidationError);
    assert.match(error.message, messagePattern);
    return true;
  });
}

void describe("validateMediaFileMetadata", () => {
  void test("accepts every supported image type and trims the file name", () => {
    for (const contentType of MEDIA_CONTENT_TYPES) {
      assert.deepEqual(
        validateMediaFileMetadata({
          fileName: "  studio-image  ",
          contentType,
          size: 1,
        }),
        {
          fileName: "studio-image",
          contentType,
          size: 1,
        },
      );
    }
  });

  void test("rejects unsupported media and empty or invalid file sizes", () => {
    expectValidationError(
      () =>
        validateMediaFileMetadata({
          fileName: "drawing.svg",
          contentType: "image/svg+xml",
          size: 100,
        }),
      /Only JPEG, PNG, WebP, GIF, and AVIF/,
    );

    for (const size of [0, -1, 1.5, Number.NaN]) {
      expectValidationError(
        () =>
          validateMediaFileMetadata({
            fileName: "empty.png",
            contentType: "image/png",
            size,
          }),
        /must not be empty/,
      );
    }
  });

  void test("accepts the 20 MiB boundary and rejects larger files", () => {
    assert.equal(
      validateMediaFileMetadata({
        fileName: "maximum.avif",
        contentType: "image/avif",
        size: MAX_MEDIA_FILE_SIZE,
      }).size,
      MAX_MEDIA_FILE_SIZE,
    );

    expectValidationError(
      () =>
        validateMediaFileMetadata({
          fileName: "too-large.avif",
          contentType: "image/avif",
          size: MAX_MEDIA_FILE_SIZE + 1,
        }),
      /20 MiB or smaller/,
    );
  });
});

void describe("createMediaObjectKey", () => {
  void test("sanitizes the basename and derives the extension from the MIME type", () => {
    const key = createMediaObjectKey(
      {
        fileName: "../../Crème brûlée FINAL.svg",
        contentType: "image/png",
      },
      {
        now: new Date("2026-07-27T12:34:56.789Z"),
        uuid: validUuid,
      },
    );

    assert.match(
      key,
      /^media\/\d{16}-20260727123456789-creme-brulee-final-12345678-1234-4abc-8def-1234567890ab\.png$/,
    );
  });

  void test("uses UUIDs to avoid collisions for otherwise identical uploads", () => {
    const input = {
      fileName: "same-name.jpg",
      contentType: "image/jpeg" as const,
    };
    const first = createMediaObjectKey(input, {
      now: 1_753_616_096_789,
      uuid: "00000000-0000-4000-8000-000000000001",
    });
    const second = createMediaObjectKey(input, {
      now: 1_753_616_096_789,
      uuid: "00000000-0000-4000-8000-000000000002",
    });

    assert.notEqual(first, second);
  });

  void test("sorts newer keys before older keys", () => {
    const input = {
      fileName: "ordered.webp",
      contentType: "image/webp" as const,
    };
    const older = createMediaObjectKey(input, {
      now: Date.UTC(2026, 6, 26),
      uuid: validUuid,
    });
    const newer = createMediaObjectKey(input, {
      now: Date.UTC(2026, 6, 27),
      uuid: validUuid,
    });

    assert.ok(newer < older);
  });

  void test("rejects non-canonical upload identifiers", () => {
    expectValidationError(
      () =>
        createMediaObjectKey(
          { fileName: "image.gif", contentType: "image/gif" },
          { uuid: "../not-an-id" },
        ),
      /identifier is invalid/,
    );
  });
});

void describe("managed media URLs", () => {
  void test("enforces the managed media prefix without traversal segments", () => {
    assert.equal(isManagedMediaKey("media/image.png"), true);
    assert.equal(isManagedMediaKey("media/nested/image.png"), true);

    for (const key of [
      "image.png",
      "other/image.png",
      "media/",
      "media//image.png",
      "media/./image.png",
      "media/../image.png",
      "media/nested/../../image.png",
      "media\\image.png",
      "media/image\0.png",
      "media/file.html",
    ]) {
      assert.equal(isManagedMediaKey(key), false, key);
    }
  });

  void test("URL-encodes each object-key segment", () => {
    assert.equal(
      publicMediaUrl(
        "https://media.example.com/",
        "media/Studio Set/image #1+final.png",
      ),
      "https://media.example.com/media/Studio%20Set/image%20%231%2Bfinal.png",
    );
  });

  void test("rejects keys outside the managed prefix", () => {
    expectValidationError(
      () => publicMediaUrl("https://media.example.com", "private/image.png"),
      /Media key is invalid/,
    );
  });

  void test("requires a credential-free public origin", () => {
    for (const baseUrl of [
      "https://user:password@media.example.com",
      "https://media.example.com/assets",
      "https://media.example.com?variant=public",
    ]) {
      expectValidationError(
        () => publicMediaUrl(baseUrl, "media/image.png"),
        /must be an HTTP\(S\) origin without credentials, a path, a query, or a fragment/,
      );
    }
  });

  void test("enforces the database's 500-character public URL boundary", () => {
    const baseUrl = "https://media.example.com";
    const exactKey = `${MEDIA_PREFIX}${"a".repeat(
      MAX_MEDIA_PUBLIC_URL_LENGTH -
        baseUrl.length -
        1 -
        MEDIA_PREFIX.length -
        ".png".length,
    )}.png`;

    assert.equal(
      publicMediaUrl(baseUrl, exactKey).length,
      MAX_MEDIA_PUBLIC_URL_LENGTH,
    );
    expectValidationError(
      () => publicMediaUrl(baseUrl, exactKey.replace(".png", "a.png")),
      /at most 500 characters/,
    );
  });
});
