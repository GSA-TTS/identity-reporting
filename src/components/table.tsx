import { VNode, render } from "preact";
import { csvFormatValue } from "d3-dsv";
import Icon from "./icon";

export type TableCell = string | number | VNode;
export type TableRow = TableCell[];

export interface TableData {
  header: TableRow;
  body: TableRow[];
  footer?: TableRow;
}

type NumberFormatter = (n: number) => string;

interface TableProps {
  data: TableData;
  numberFormatter?: NumberFormatter;
}

function Row({
  row,
  numberFormatter = String,
}: {
  row: TableRow;
  numberFormatter: NumberFormatter;
}): VNode {
  return (
    <tr>
      {row.map((d) => {
        if (typeof d === "object" && d.type === "td") {
          return d;
        }
        if (typeof d === "number") {
          return <td className="table-number text-tabular text-right">{numberFormatter(d)}</td>;
        }
        return <td>{d}</td>;
      })}
    </tr>
  );
}

function textContent(v: VNode): string {
  const doc = document.implementation.createHTMLDocument("");
  render(v, doc.body);
  return doc.body.textContent || "";
}

interface CSVProps {
  "data-csv": string[];
  colSpan: number;
}

function toCSVValues(cell: TableCell): string[] {
  if (typeof cell === "object") {
    if ("data-csv" in cell.props) {
      return (cell.props as unknown as CSVProps)["data-csv"];
    }

    const text = textContent(cell);
    const colspan = (cell.props as unknown as CSVProps).colSpan || 1;

    const empties = Array(colspan - 1).fill("");

    return [text, ...empties];
  }
  return [String(cell)];
}

function toCSV(data: TableData): string {
  const { header, body } = data;

  const rows = [
    header.flatMap((v) => toCSVValues(v)),
    ...body.map((row) => row.flatMap((v) => toCSVValues(v))),
  ];

  return rows.map((row) => row.map((c) => csvFormatValue(c)).join(",")).join("\n");
}

function Table({ data, numberFormatter = String }: TableProps): VNode {
  const { header, body, footer } = data;
  return (
    <>
      <div className="usa-table-container--scrollable">
        <table className="usa-table usa-table--compact">
          <thead>
            <tr>
              {header.map((head) =>
                typeof head === "object" && head.type === "th" ? head : <th>{head}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {body.map((row) => (
              <Row row={row} numberFormatter={numberFormatter} />
            ))}
          </tbody>
          {footer && (
            <tfoot>
              <Row row={footer} numberFormatter={numberFormatter} />
            </tfoot>
          )}
        </table>
      </div>

      <a
        className="usa-button usa-button--outline"
        download="report.csv"
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(toCSV(data))}`}
      >
        <Icon icon="file_download" />
        Download as CSV
      </a>
    </>
  );
}

export default Table;
