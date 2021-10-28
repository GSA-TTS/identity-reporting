import { VNode } from "preact";

export type TableRow = (string | number | VNode)[];

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

function Table({ data, numberFormatter = String }: TableProps): VNode {
  const { header, body, footer } = data;
  return (
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
  );
}

export default Table;
