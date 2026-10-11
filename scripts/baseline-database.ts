import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const prismaCli = resolve(projectRoot, "node_modules/prisma/build/index.js");
const baselineMigrations = [
  "20260806000000_init",
  "20260807000000_add_commission_category",
  "20260811000000_add_site_settings_hero_images",
];

function prisma(args: string[], input?: string) {
  const result = spawnSync("node", [prismaCli, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    input,
  });
  if (result.error) throw result.error;
  return result;
}

try {
  // Run a read-only guard through the schema engine. Do not load Prisma Client:
  // its native query library may be unavailable in a deployment shell.
  const guard = prisma(
    ["db", "execute", "--stdin", "--schema", "prisma/schema.prisma"],
    `DO $$
      DECLARE failed BOOLEAN;
      BEGIN
        IF to_regclass(format('%I.%I', current_schema(), '_prisma_migrations')) IS NOT NULL THEN
          EXECUTE 'SELECT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL)' INTO failed;
          IF failed THEN
            RAISE EXCEPTION 'A failed migration needs to be resolved before baselining.';
          END IF;
        END IF;
      END
    $$;`,
  );
  if (guard.status !== 0) {
    console.error(guard.stdout);
    console.error(guard.stderr);
    throw new Error(
      "Migration history could not be verified. No changes made.",
    );
  }
  const status = prisma(["migrate", "status"]);

  if (status.status === 0) {
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

    for (const migration of baselineMigrations) {
      const result = prisma(["migrate", "resolve", "--applied", migration]);
      if (
        result.status !== 0 &&
        /\bP3008\b/.test(`${result.stdout}\n${result.stderr}`)
      ) {
        console.log(`Already recorded: ${migration}`);
        continue;
      }
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
}
