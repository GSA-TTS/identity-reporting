import { expect } from "chai";
import fetchMock from "fetch-mock";
import { yearMonthDayParse } from "../formats";
import { loadData } from "./daily-auths-report-data";

describe("DailyAuthsReport", () => {
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
      ).then((processed) => {
        expect(processed).to.have.lengthOf(2);
        processed.forEach((result) => {
          expect(result).to.have.property("date");
          expect(result.agency, "sets a default agency if missing").to.not.be.undefined;
        });
      });
    });

    after(() => fetchMock.restore());
  });
});
