import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { siteSettingsUpdateSchema } from "./site-settings-schema";

void describe("siteSettingsUpdateSchema", () => {
  void test("accepts a complete image and alt-text pair", () => {
    assert.deepEqual(
      siteSettingsUpdateSchema.parse({
        heroImageUrl: "  https://media.example.com/hero.webp  ",
        heroImageAlt: "  Der Künstler in seinem Atelier  ",
      }),
      {
        heroImageUrl: "https://media.example.com/hero.webp",
        heroImageAlt: "Der Künstler in seinem Atelier",
      },
    );
  });

  void test("accepts clearing both hero fields together", () => {
    assert.deepEqual(
      siteSettingsUpdateSchema.parse({
        heroImageUrl: null,
        heroImageAlt: null,
      }),
      {
        heroImageUrl: null,
        heroImageAlt: null,
      },
    );
  });

  void test("rejects either half of the pair on its own", () => {
    for (const input of [
      {
        heroImageUrl: "https://media.example.com/hero.webp",
        heroImageAlt: null,
      },
      {
        heroImageUrl: null,
        heroImageAlt: "Der Künstler in seinem Atelier",
      },
    ]) {
      const result = siteSettingsUpdateSchema.safeParse(input);

      assert.equal(result.success, false);
      if (!result.success) {
        assert.match(
          result.error.issues[0]?.message ?? "",
          /gemeinsam gesetzt/,
        );
      }
    }
  });
});
