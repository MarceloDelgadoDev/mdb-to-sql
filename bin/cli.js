#!/usr/bin/env node
import { readFileSync } from "fs";
import path from "path";
import chalk from "chalk";
import { convertMdbToSql } from "../src/converter.js";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

const LINE_W = 54;
const LINE = chalk.gray("─".repeat(LINE_W));

function formatKb(bytes) {
  return (Number(bytes) / 1024).toFixed(1);
}

function exitWithError(code, message) {
  console.error(message.startsWith("Usage:") ? message : `Error: ${message}`);
  process.exit(code);
}

/** Summary row: bold label, arrow, and dim value. */
function summaryRow(label, value, labelWidth = 12) {
  const lbl = chalk.bold(label.padEnd(labelWidth, " "));
  const arrow = chalk.dim("->");
  const val = chalk.dim(value);
  return `${lbl}${arrow} ${val}`;
}

const args = process.argv.slice(2);

if (args.length === 0) {
  exitWithError(1, "Usage: mdb-to-sql <path-to-file.mdb>");
}

const inputPath = args[0];
const lowerExt = path.extname(inputPath).toLowerCase();

if (lowerExt !== ".mdb") {
  exitWithError(1, "Only .mdb files are supported in this version.");
}

const absMdb = path.resolve(inputPath);
const absSql = absMdb.replace(/\.mdb$/i, ".sql");

try {
  const result = await convertMdbToSql(absMdb, absSql, { version: pkg.version });

  console.log("");
  console.log(LINE);
  console.log(`🚀 ${chalk.bold.white("MDB → SQL Converter")}`);
  console.log(
    chalk.dim(
      "   Fast conversion from Microsoft Access (.mdb) to portable SQL"
    )
  );
  console.log(LINE);

  console.log(
    `📥 ${chalk.bold.white("Source")} ${chalk.dim("->")} ${chalk.dim(absMdb)}`
  );
  console.log(
    `📥 ${chalk.bold.white("Output")} ${chalk.dim("->")} ${chalk.dim(absSql)}`
  );
  console.log(LINE);

  console.log(
    `📚 ${chalk.bold.white(`Tables found: ${result.tableCount}`)}`
  );
  console.log("");

  for (const t of result.tables) {
    console.log(
      `${chalk.green("✓")} ${chalk.green(`"${t.name}"`)}${chalk.dim(
        `  ${t.rows} rows • ${t.columns} columns`
      )}`
    );
  }

  console.log(LINE);
  console.log(
    `✅ ${chalk.bold.green("Conversion completed successfully")}`
  );
  console.log("");
  console.log(
    summaryRow("Tables", `${result.tableCount} converted`)
  );
  console.log(summaryRow("Rows", String(result.totalRows)));
  console.log(
    summaryRow("Size", `${formatKb(result.bytesWritten)} KB`)
  );
  console.log(summaryRow("File", absSql));
  console.log(LINE);
  console.log("");

  process.exit(0);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  const code =
    err && typeof err === "object" && "code" in err ? err.code : undefined;

  console.error(`Error: ${msg}`);

  if (code === "ENOENT") process.exit(1);
  if (code === "FS_READ") process.exit(1);
  if (code === "MDB_PARSE") process.exit(2);
  if (code === "SQL_WRITE") process.exit(3);
  process.exit(3);
}
