import { VNode } from "preact";

export type TableRow = (string | number | VNode)[];

export interface TableData {
  header: TableRow;
  body: TableRow[];
}

interface TableProps {
  data: TableData;
  numberFormatter?: (n: number) => string;
}

function Table({ data, numberFormatter = String }: TableProps): VNode {
  const { header, body } = data;
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
            <tr>
              {row.map((d) =>
                typeof d === "object" && d.type === "td" ? (
                  d
                ) : typeof d === "number" ? (
                  <td className="table-number text-tabular text-right">{numberFormatter(d)}</td>
                ) : (
                  <td>{d}</td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
