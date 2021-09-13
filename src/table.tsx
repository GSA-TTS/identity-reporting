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
    <table className="usa-table">
      <thead>
        <tr>
          {header.map((head) => (
            <th>{head}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((row) => (
          <tr>
            {row.map((d) =>
              typeof d === "number" ? (
                <td class="table-number text-tabular text-right">{numberFormatter(d)}</td>
              ) : (
                <td>{d}</td>
              )
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
