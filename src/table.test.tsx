import { expect } from "chai";
import { render } from "@testing-library/preact";
import Table, { TableData } from "./table";

describe("Table", () => {
  it("wraps header elements in <th> and body elements in <td>", () => {
    const data = {
      header: ["name", "color"],
      body: [
        ["bob", "red"],
        ["alice", "blue"],
      ],
    };

    const { container } = render(<Table data={data} />);
    const thValues = Array.from(container.querySelectorAll("table thead th")).map(
      (th) => th.textContent
    );
    expect(thValues).to.deep.equal(data.header);

    const tdValues = Array.from(container.querySelectorAll("table tbody tr")).map((tr) =>
      Array.from(tr.querySelectorAll("td")).map((td) => td.textContent)
    );
    expect(tdValues).to.deep.equal(data.body);
  });

  it("formats numbers as aligned right, using the numberFormatter", () => {
    const data = {
      header: ["num"],
      body: [[1000]],
    };

    function numberFormatter(num: number) {
      return `!!${num}!!`;
    }

    const { container } = render(<Table data={data} numberFormatter={numberFormatter} />);
    const td = container.querySelector("table tbody td");
    expect(td?.textContent).to.equal("!!1000!!");
    expect(td?.classList.contains("text-right")).to.eq(true);
    expect(td?.classList.contains("text-tabular")).to.eq(true);
    expect(td?.classList.contains("table-number")).to.eq(true);
  });

  it("passes through <th> in header and <td> in the body", () => {
    const data: TableData = {
      header: [
        <th colSpan={2} data-something="hi">
          header
        </th>,
      ],
      body: [
        [
          <td colSpan={2} data-something="hello">
            cell
          </td>,
        ],
      ],
    };

    const { container } = render(<Table data={data} />);

    const ths = container.querySelectorAll("table thead th");
    expect(ths.length).to.eq(1);
    const th = ths[0];
    expect(th.getAttribute("colspan")).to.eq("2");
    expect(th.getAttribute("data-something")).to.equal("hi");

    const tds = container.querySelectorAll("table tbody td");
    expect(tds.length).to.eq(1);
    const td = tds[0];
    expect(td.getAttribute("colspan")).to.eq("2");
    expect(td.getAttribute("data-something")).to.equal("hello");
  });
});
