import MDBReader from "mdb-reader";

const DEFAULT_CHUNK = 4000;

/**
 * Abre o buffer .mdb e expõe leitor e nomes de tabelas (somente tabelas de usuário).
 * @param {Buffer} buffer
 */
export function openMdb(buffer) {
  const reader = new MDBReader(buffer);
  const tableNames = reader.getTableNames({
    normalTables: true,
    systemTables: false,
    linkedTables: false,
  });
  return { reader, tableNames };
}

/**
 * Metadados e objeto Table do mdb-reader.
 * @param {MDBReader} reader
 * @param {string} tableName
 */
export function getTableMetadata(reader, tableName) {
  const table = reader.getTable(tableName);
  const columnNames = table.getColumnNames();
  const columns = columnNames.map((name) => table.getColumn(name));
  return { table, columns, columnNames };
}

/**
 * Itera registros da tabela em blocos para limitar pico de memória (RNF-02).
 * @param {{ rowCount: number, getData: (opts?: { rowOffset?: number, rowLimit?: number }) => Record<string, import('mdb-reader').Value>[] }} table
 * @param {number} [chunkSize]
 * @returns {Generator<Record<string, import('mdb-reader').Value>[]>}
 */
export function* iterateTableRows(table, chunkSize = DEFAULT_CHUNK) {
  for (let offset = 0; offset < table.rowCount; offset += chunkSize) {
    const rowLimit = Math.min(chunkSize, table.rowCount - offset);
    yield table.getData({ rowOffset: offset, rowLimit });
  }
}
