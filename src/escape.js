import { ColumnType } from "mdb-reader";

/**
 * Escapa conteúdo string para uso dentro de aspas simples em SQL (RF-07).
 */
export function escapeSqlString(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/'/g, "''");
}

/**
 * Formata um identificador com backticks (duplica ` internos).
 */
export function quoteIdentifier(name) {
  return "`" + String(name).replace(/`/g, "``") + "`";
}

function sqlQuotedString(value) {
  return "'" + escapeSqlString(value) + "'";
}

/**
 * Emite literal SQL para um valor de célula, de acordo com o tipo da coluna Access.
 */
export function formatSqlValue(column, value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  switch (column.type) {
    case ColumnType.Boolean:
      return value ? "1" : "0";

    case ColumnType.Byte:
    case ColumnType.Integer:
    case ColumnType.Long:
    case ColumnType.Complex:
      return String(Number(value));

    case ColumnType.Float:
    case ColumnType.Double:
      return formatNumericLiteral(Number(value));

    case ColumnType.Currency:
    case ColumnType.Numeric: {
      const n = typeof value === "number" ? value : Number.parseFloat(String(value));
      if (Number.isFinite(n)) {
        return formatNumericLiteral(n);
      }
      return sqlQuotedString(String(value));
    }

    case ColumnType.BigInt:
      return sqlQuotedString(String(value));

    case ColumnType.DateTime:
      return sqlQuotedString(/** @type {Date} */ (value).toISOString());

    case ColumnType.DateTimeExtended:
      return sqlQuotedString(String(value));

    case ColumnType.Text:
    case ColumnType.Memo:
    case ColumnType.RepID:
      return sqlQuotedString(String(value));

    case ColumnType.Binary:
    case ColumnType.OLE:
      return Buffer.isBuffer(value)
        ? sqlQuotedString(value.toString("hex"))
        : "NULL";

    default:
      return sqlQuotedString(String(value));
  }
}

function formatNumericLiteral(n) {
  if (!Number.isFinite(n)) {
    return "NULL";
  }
  if (Object.is(n, -0)) {
    return "0";
  }
  return String(n);
}
