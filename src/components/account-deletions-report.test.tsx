import { expect } from "chai";
import { formatData, tabulate } from "./account-deletions-report";
import { yearMonthDayParse } from "../formats";
import type { ProcessedResult } from "../models/daily-registrations-report-data";

describe("AccountDeletionsReport", () => {
  describe("#formatData", () => {
    const results: ProcessedResult[] = [
      {
        date: yearMonthDayParse("2023-01-02"),
        fullyRegisteredUsers: 100,
        deletedUsers: 7,
      } as ProcessedResult,
      ...Array.from(
        Array(6),
        (_value, index) =>
          ({
            date: yearMonthDayParse(`2023-01-0${3 + index}`),
            fullyRegisteredUsers: 100,
            deletedUsers: 0,
          } as ProcessedResult)
      ),
      {
        date: yearMonthDayParse("2023-01-09"),
        fullyRegisteredUsers: 100,
        deletedUsers: 14,
      } as ProcessedResult,
      ...Array.from(
        Array(6),
        (_value, index) =>
          ({
            date: yearMonthDayParse(`2023-01-1${index}`),
            fullyRegisteredUsers: 100,
            deletedUsers: 0,
          } as ProcessedResult)
      ),
    ];

    it("formats processed results", () => {
      const formattedData = formatData(results);

      expect(formattedData).to.deep.equal([
        {
          date: yearMonthDayParse("2023-01-02"),
          value: 0.01,
        },
        {
          date: yearMonthDayParse("2023-01-09"),
          value: 0.02,
        },
      ]);
    });
  });

  describe("#tabulate", () => {
    const formattedData = [
      {
        date: yearMonthDayParse("2023-01-02"),
        value: 0.01,
      },
      {
        date: yearMonthDayParse("2023-01-09"),
        value: 0.02,
      },
    ];

    it("tabulates formatted data", () => {
      const table = tabulate(formattedData);

      expect(table).to.deep.equal({
        header: ["Week Start", "Percent"],
        body: [
          ["2023-01-02", 0.01],
          ["2023-01-09", 0.02],
        ],
      });
    });
  });
});
