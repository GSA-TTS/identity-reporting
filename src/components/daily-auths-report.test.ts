import { expect } from "chai";
import { VNode } from "preact";
import { ProcessedResult } from "src/models/daily-auths-report-data";
import { TableRow } from "./table";
import { yearMonthDayParse } from "../formats";
import { tabulate, tabulateSumByAgency } from "./daily-auths-report";

describe("models/DailyAuthsReport", () => {
  const results = [
    {
      date: yearMonthDayParse("2021-01-01"),
      ial: 1,
      issuer: "issuer1",
      agency: "agency1",
      friendly_name: "app1",
      count: 100,
    },
    {
      date: yearMonthDayParse("2021-01-01"),
      ial: 2,
      issuer: "issuer1",
      agency: "agency1",
      friendly_name: "app1",
      count: 1,
    },
    {
      date: yearMonthDayParse("2021-01-01"),
      ial: 1,
      issuer: "issuer2",
      agency: "agency1",
      friendly_name: "app2",
      count: 1000,
    },
    {
      date: yearMonthDayParse("2021-01-01"),
      ial: 1,
      issuer: "issuer3",
      agency: "agency2",
      friendly_name: "app3",
      count: 555,
    },
    {
      date: yearMonthDayParse("2021-01-02"),
      ial: 1,
      issuer: "issuer1",
      agency: "agency1",
      friendly_name: "app1",
      count: 111,
    },
  ] as ProcessedResult[];

  describe("#tabulate", () => {
    function simplifyVNodes(body: TableRow[]): (string | number)[][] {
      return body.map(([agency, issuerSpan, ...rest]) => [
        agency,
        (issuerSpan as VNode<{ title: string }>).props.title,
        ...rest,
      ]) as (string | number)[][];
    }

    it("builds a table by agency, issuer, ial", () => {
      const table = tabulate({ results });

      expect(table.header).to.deep.eq([
        "Agency",
        "App",
        "IAL",
        "2021-01-01",
        "2021-01-02",
        "Total",
      ]);
      expect(table.body).to.have.lengthOf(4);
      expect(simplifyVNodes(table.body)).to.deep.equal([
        ["agency1", "issuer1", "1", 100, 111, 211],
        ["agency1", "issuer1", "2", 1, 0, 1],
        ["agency1", "issuer2", "1", 1000, 0, 1000],
        ["agency2", "issuer3", "1", 555, 0, 555],
      ]);
    });

    it("filters by agency", () => {
      const table = tabulate({ results, filterAgency: "agency1" });

      expect(simplifyVNodes(table.body)).to.deep.equal([
        ["agency1", "issuer1", "1", 100, 111, 211],
        ["agency1", "issuer1", "2", 1, 0, 1],
        ["agency1", "issuer2", "1", 1000, 0, 1000],
      ]);
    });
    it("filters by ial", () => {
      const table = tabulate({ results, filterIal: 2 });

      expect(simplifyVNodes(table.body)).to.deep.equal([["agency1", "issuer1", "2", 1, 1]]);
    });
  });

  describe("#tabulateSumByAgency", () => {
    function simplifyVNodes(body: TableRow[]): (string | number)[][] {
      return body.map(([agency, ...rest]) => [(agency as VNode).props.children, ...rest]) as (
        | string
        | number
      )[][];
    }

    it("builds a table by agency, ial and sums across issuers", () => {
      const table = tabulateSumByAgency({ results, filterIal: 1, setParameters: () => null });

      expect(table.header).to.deep.eq(["Agency", "IAL", "2021-01-01", "2021-01-02", "Total"]);
      expect(table.body).to.have.lengthOf(2);
      expect(simplifyVNodes(table.body)).to.deep.equal([
        ["agency1", "1", 1100, 111, 1211],
        ["agency2", "1", 555, 0, 555],
      ]);
    });
  });
});
