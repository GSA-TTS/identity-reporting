import { html } from "htm/preact";

/**
 * @typedef {(string|number|import('preact').VNode)[]} TableRow
 */

/**
 * @typedef TableData
 * @property {TableRow} header
 * @property {TableRow[]} body
 * @property {(n:number)=>string=} numberFormatter
 */

/**
 * @typedef TableProps
 * @prop {TableData} data
 */

/**
 * @param {TableProps} props
 * @returns {import('preact').VNode}
 */
function Table({ data }) {
  const { header, body, numberFormatter = String } = data;
  return html`
    <table>
      <thead>
        <tr>
          ${header.map((h) => html`<th>${h}</th>`)}
        </tr>
      </thead>
      <tbody>
        ${body.map(
          (row) =>
            html`<tr>
              ${row.map((d) =>
                typeof d === "number"
                  ? html`<td class="table-number">${numberFormatter(d)}</td>`
                  : html`<td>${d}</td>`
              )}
            </tr>`
        )}
      </tbody>
    </table>
  `;
}

export default Table;
