import { readFileSync } from "fs";
import { stat } from "fs/promises";
import { SqlFileWriter } from "./writer.js";
import { getTableMetadata, iterateTableRows, openMdb } from "./reader.js";

/**
 * Converte um .mdb em .sql (caminhos absolutos recomendados para mensagens).
 * @param {string} absoluteMdbPath
 * @param {string} absoluteSqlPath
 * @param {object} [options]
 * @param {string} [options.version]
 * @returns {Promise<{ tableCount: number, totalRows: number, bytesWritten: bigint, tables: { name: string, rows: number, columns: number }[] }>}
 */
export async function convertMdbToSql(absoluteMdbPath, absoluteSqlPath, options = {}) {
  const version = options.version ?? "1.0.0";
  let buffer;
  try {
    buffer = readFileSync(absoluteMdbPath);
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? err.code : undefined;
    if (code === "ENOENT") {
      const e = new Error(`File not found: ${absoluteMdbPath}`);
      /** @type {any} */ (e).code = "ENOENT";
      throw e;
    }
    const e = new Error(
      err instanceof Error ? err.message : "Error reading input file"
    );
    /** @type {any} */ (e).cause = err;
    /** @type {any} */ (e).code = "FS_READ";
    throw e;
  }

  let reader;
  let tableNames;
  try {
    ({ reader, tableNames } = openMdb(buffer));
  } catch (err) {
    const e = new Error(
      err instanceof Error ? err.message : "Failed to parse .mdb file"
    );
    /** @type {any} */ (e).cause = err;
    /** @type {any} */ (e).code = "MDB_PARSE";
    throw e;
  }

  /** @type {SqlFileWriter | null} */
  let writer = null;

  try {
    writer = new SqlFileWriter(absoluteSqlPath);
    await writer.writePreamble(version, absoluteMdbPath);

    /** @type {{ name: string, rows: number, columns: number }[]} */
    const tables = [];
    let totalRows = 0;

    for (const name of tableNames) {
      const { table, columns, columnNames } = getTableMetadata(reader, name);
      const rowCount = table.rowCount;
      const colCount = columnNames.length;

      tables.push({ name, rows: rowCount, columns: colCount });
      totalRows += rowCount;

      await writer.writeTableSection(
        name,
        columns,
        columnNames,
        iterateTableRows(table)
      );
    }

    await writer.close();
    const st = await stat(absoluteSqlPath);

    return {
      tableCount: tableNames.length,
      totalRows,
      bytesWritten: BigInt(st.size),
      tables,
    };
  } catch (err) {
    if (writer?.stream && !writer.stream.writableEnded) {
      writer.stream.destroy();
    }
    if (writer) {
      const e = err instanceof Error ? err : new Error(String(err));
      if (!/** @type {any} */ (e).code) /** @type {any} */ (e).code = "SQL_WRITE";
      throw e;
    }
    throw err;
  }
}
