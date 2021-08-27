import { path } from "./report";
import { expect } from "chai";

describe("Report", () => {
  describe("#path", () => {
    it("formats a report as a path", () => {
      const date = new Date("2021-12-01");

      expect(path({ reportName: "some-report", date })).to.equal(
        "/prod/some-report/2021/2021-12-01.some-report.json"
      );
    });
  });
});
