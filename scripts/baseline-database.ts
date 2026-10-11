import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { PrismaClient } from "../generated/prisma";

const projectRoot = resolve(import.meta.dirname, "..");
const prismaCli = resolve(projectRoot, "node_modules/prisma/build/index.js");
const baselineMigrations = [
  "20260806000000_init",
  "20260807000000_add_commission_category",
  "20260811000000_add_site_settings_hero_images",
];

function prisma(args: string[]) {
  const result = spawnSync("node", [prismaCli, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  return result;
}

const db = new PrismaClient();

try {
  const tables = await db.$queryRaw<{ exists: boolean }[]>`
    SELECT to_regclass(format('%I.%I', current_schema(), '_prisma_migrations'))
      IS NOT NULL AS "exists"
  `;
  const history = tables[0]?.exists
    ? await db.$queryRaw<
        {
          migration_name: string;
          finished_at: Date | null;
          rolled_back_at: Date | null;
        }[]
      >`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`
    : [];
  if (history.some((row) => !row.finished_at && !row.rolled_back_at)) {
    throw new Error(
      "A failed migration needs to be resolved before baselining. No changes made.",
    );
  }
  const applied = new Set(
    history
      .filter((row) => row.finished_at && !row.rolled_back_at)
      .map((row) => row.migration_name),
  );
  const missing = baselineMigrations.filter((name) => !applied.has(name));

  if (missing.length === 0) {
    console.log("The database baseline is already recorded.");
  } else {
    // Read-only comparison against the frozen schema that predates the PDF change.
    const comparison = prisma([
      "migrate",
      "diff",
      "--from-schema-datasource",
      "prisma/schema.prisma",
      "--to-schema-datamodel",
      "prisma/baseline.prisma",
      "--exit-code",
    ]);
    if (comparison.status !== 0) {
      console.error(comparison.stdout);
      console.error(comparison.stderr);
      throw new Error(
        "The database does not match the existing pre-PDF schema, or could not be checked. No migrations were marked as applied.",
      );
    }

    for (const migration of missing) {
      const result = prisma(["migrate", "resolve", "--applied", migration]);
      if (result.status !== 0) {
        console.error(result.stdout);
        console.error(result.stderr);
        throw new Error(`Could not record ${migration}.`);
      }
      console.log(`Recorded existing migration: ${migration}`);
    }
    console.log(
      "Baseline recorded; existing tables and data were preserved. Run bun run db:migrate to apply pending migrations.",
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
