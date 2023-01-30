import { expect } from "chai";
import { yearMonthDayParse } from "../formats";
import { ProcessedResult } from "../models/daily-registrations-report-data";
import { tabulate } from "./daily-registrations-report";

describe("DailyRegistrationsReport", () => {
  describe("#tabulate", () => {
    it("renders a table", () => {
      const results: ProcessedResult[] = [
        {
          date: yearMonthDayParse("2020-01-01"),
          totalUsers: 5,
          fullyRegisteredUsers: 1,
          totalUsersCumulative: 10,
          fullyRegisteredUsersCumulative: 2,
        },
        {
          date: yearMonthDayParse("2020-01-02"),
          totalUsers: 6,
          fullyRegisteredUsers: 2,
          totalUsersCumulative: 17,
          fullyRegisteredUsersCumulative: 4,
        },
      ];

      const table = tabulate(results);

      expect(table).to.deep.equal({
        header: ["", "2020-01-01", "2020-01-02"],
        body: [
          ["New Users", 5, 6],
          ["New Fully Registered Users", 1, 2],
          ["Cumulative Users", 10, 17],
          ["Cumulative Fully Registered Users", 2, 4],
        ],
      });
    });
  });
});
