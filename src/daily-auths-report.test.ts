import { VNode } from "preact";
import { expect } from "chai";
import { utcParse } from "d3-time-format";
import fetchMock from "fetch-mock";
import { tabulate, tabulateSumByAgency, loadData, ProcessedResult } from "./daily-auths-report";
import { TableRow } from "./table";

describe("DailyAuthsReport", () => {
  const yearMonthDayParse = utcParse("%Y-%m-%d") as (s: string) => Date;

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
      const table = tabulate(results);

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
      const table = tabulate(results, "agency1");

      expect(simplifyVNodes(table.body)).to.deep.equal([
        ["agency1", "issuer1", "1", 100, 111, 211],
        ["agency1", "issuer1", "2", 1, 0, 1],
        ["agency1", "issuer2", "1", 1000, 0, 1000],
      ]);
    });
    it("filters by ial", () => {
      const table = tabulate(results, undefined, 2);

      expect(simplifyVNodes(table.body)).to.deep.equal([["agency1", "issuer1", "2", 1, 1]]);
    });
  });

  describe("#tabulateSumByAgency", () => {
    it("builds a table by agency, ial and sums across issuers", () => {
      const table = tabulateSumByAgency(results, 1);

      expect(table.header).to.deep.eq(["Agency", "IAL", "2021-01-01", "2021-01-02", "Total"]);
      expect(table.body).to.have.lengthOf(2);
      expect(table.body).to.deep.equal([
        ["agency1", "1", 1100, 111, 1211],
        ["agency2", "1", 555, 0, 555],
      ]);
    });
  });

  describe("#loadData", () => {
    it("combines data across separate fetch requests", () => {
      const fetch = fetchMock
        .sandbox()
        .get("/local/daily-auths-report/2021/2021-01-01.daily-auths-report.json", {
          start: "2020-01-01",
          results: [{ count: 1 }],
        })
        .get("/local/daily-auths-report/2021/2021-01-02.daily-auths-report.json", {
          start: "2020-01-02",
          results: [{ count: 10 }],
        });

      return loadData(
        yearMonthDayParse("2021-01-01"),
        yearMonthDayParse("2021-01-03"),
        "local",
        fetch
      ).then((results) => {
        expect(results).to.have.lengthOf(2);
        results.forEach((result) => {
          expect(result).to.have.property("date");
          expect(result.agency, "sets a default agency if missing").to.not.be.undefined;
        });
      });
    });

    after(() => fetchMock.restore());
  });
});
