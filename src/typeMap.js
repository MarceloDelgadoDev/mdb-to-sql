import { ColumnType } from "mdb-reader";

/**
 * Tipo SQL declarado no CREATE TABLE (RF-06).
 * @param {import('mdb-reader').Column} column
 * @returns {'TEXT' | 'INTEGER' | 'REAL'}
 */
export function columnToSqlType(column) {
  switch (column.type) {
    case ColumnType.Boolean:
    case ColumnType.Byte:
    case ColumnType.Integer:
    case ColumnType.Long:
    case ColumnType.Complex:
      return "INTEGER";

    case ColumnType.Float:
    case ColumnType.Double:
    case ColumnType.Currency:
    case ColumnType.Numeric:
      return "REAL";

    case ColumnType.BigInt:
      return "TEXT";

    case ColumnType.DateTime:
    case ColumnType.DateTimeExtended:
    case ColumnType.Text:
    case ColumnType.Memo:
    case ColumnType.Binary:
    case ColumnType.OLE:
    case ColumnType.RepID:
    default:
      return "TEXT";
  }
}
