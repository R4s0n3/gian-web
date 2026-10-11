import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const prismaCli = resolve(projectRoot, "node_modules/prisma/build/index.js");

function deploy() {
  const result = spawnSync("node", [prismaCli, "migrate", "deploy"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

try {
  let result = deploy();
  if (
    result.status !== 0 &&
    /\bP3005\b/.test(`${result.stdout}\n${result.stderr}`)
  ) {
    console.log(
      "Checking the existing database before recording its baseline…",
    );
    const baseline = spawnSync(
      process.execPath,
      ["scripts/baseline-database.ts"],
      { cwd: projectRoot, stdio: "inherit" },
    );
    if (baseline.error) throw baseline.error;
    if (baseline.status !== 0) {
      throw new Error(
        "Database baseline could not be verified; deploy stopped.",
      );
    }
    result = deploy();
  }
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
