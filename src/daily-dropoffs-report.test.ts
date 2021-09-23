import { expect } from "chai";
import fetchMock from "fetch-mock";
import { utcParse } from "d3-time-format";
import { DailyDropoffsRow, Step, aggregate, loadData, toStepCounts } from "./daily-dropoffs-report";

describe("DailyDropoffsReport", () => {
  describe("#aggregate", () => {
    it("sums up rows by issuer", () => {
      const date = new Date();

      const rows = [
        {
          issuer: "issuer1",
          friendly_name: "app1",
          agency: "agency1",
          iaa: "iaa123",
          start: date,
          finish: date,
          [Step.WELCOME]: 1,
          [Step.AGREEMENT]: 0,
          [Step.VERIFIED]: 1,
        } as DailyDropoffsRow,
        {
          issuer: "issuer1",
          friendly_name: "app1",
          agency: "agency1",
          iaa: "iaa123",
          start: date,
          finish: date,
          [Step.WELCOME]: 1,
          [Step.AGREEMENT]: 1,
          [Step.VERIFIED]: 1,
        } as DailyDropoffsRow,
        {
          issuer: "issuer2",
          friendly_name: "app2",
          agency: "agency2",
          iaa: "iaa123",
          start: date,
          finish: date,
          [Step.WELCOME]: 1,
          [Step.AGREEMENT]: 0,
          [Step.VERIFIED]: 0,
        } as DailyDropoffsRow,
      ];

      const aggregated = aggregate(rows);
      expect(aggregated).to.deep.equal([
        {
          issuer: "issuer1",
          friendly_name: "app1",
          agency: "agency1",
          iaa: "iaa123",
          start: date,
          finish: date,
          [Step.WELCOME]: 2,
          [Step.AGREEMENT]: 1,
          [Step.CAPTURE_DOCUMENT]: 0,
          [Step.CAP_DOC_SUBMIT]: 0,
          [Step.SSN]: 0,
          [Step.VERIFY_INFO]: 0,
          [Step.VERIFY_SUBMIT]: 0,
          [Step.PHONE]: 0,
          [Step.ENCRYPT]: 0,
          [Step.PERSONAL_KEY]: 0,
          [Step.VERIFIED]: 2,
        },
        {
          issuer: "issuer2",
          friendly_name: "app2",
          agency: "agency2",
          iaa: "iaa123",
          start: date,
          finish: date,
          [Step.WELCOME]: 1,
          [Step.AGREEMENT]: 0,
          [Step.CAPTURE_DOCUMENT]: 0,
          [Step.CAP_DOC_SUBMIT]: 0,
          [Step.SSN]: 0,
          [Step.VERIFY_INFO]: 0,
          [Step.VERIFY_SUBMIT]: 0,
          [Step.PHONE]: 0,
          [Step.ENCRYPT]: 0,
          [Step.PERSONAL_KEY]: 0,
          [Step.VERIFIED]: 0,
        },
      ]);
    });
  });

  describe("#loadData", () => {
    const yearMonthDayParse = utcParse("%Y-%m-%d") as (s: string) => Date;

    it("combines data across separate fetch requests", () => {
      const fetch = fetchMock
        .sandbox()
        .get(
          "/local/daily-dropoffs-report/2021/2021-01-01.daily-dropoffs-report.csv",
          `issuer,friendly_name,iaa,agency,start,finish,welcome,agreement,capture_document,cap_doc_submit,ssn,verify_info,verify_submit,phone,encrypt,personal_key,verified
issuer1,The App,iaa123,The Agency,2021-01-01T00:00:00+01:00,2021-01-01T23:59:59+01:00,3,2,2,2,2,2,2,2,2,2,1`
        )
        .get(
          "/local/daily-dropoffs-report/2021/2021-01-02.daily-dropoffs-report.csv",
          `issuer,friendly_name,iaa,agency,start,finish,welcome,agreement,capture_document,cap_doc_submit,ssn,verify_info,verify_submit,phone,encrypt,personal_key,verified
issuer1,The App,iaa123,The Agency,2021-01-02T00:00:00+01:00,2021-01-02T23:59:59+01:00,2,1,1,1,1,1,1,1,1,1,0`
        );

      return loadData(
        yearMonthDayParse("2021-01-01"),
        yearMonthDayParse("2021-01-03"),
        "local",
        fetch
      ).then((combinedRows) => {
        expect(combinedRows).to.have.lengthOf(1);
        const row = combinedRows[0];
        expect(row.issuer).to.equal("issuer1");
        expect(row.friendly_name).to.equal("The App");
        expect(row.welcome).to.equal(5);
        expect(row.verified).to.equal(1);
      });
    });

    after(() => fetchMock.restore());
  });

  describe("#toStepCounts", () => {
    it("converts a single row into an array of steps with counts and percents", () => {
      const row = {
        issuer: "issuer1",
        friendly_name: "app1",
        agency: "agency1",
        iaa: "iaa123",
        start: new Date(),
        finish: new Date(),
        [Step.WELCOME]: 1e10,
        [Step.AGREEMENT]: 1e9,
        [Step.CAPTURE_DOCUMENT]: 1e8,
        [Step.CAP_DOC_SUBMIT]: 1e7,
        [Step.SSN]: 1e6,
        [Step.VERIFY_INFO]: 1e5,
        [Step.VERIFY_SUBMIT]: 1e4,
        [Step.PHONE]: 1000,
        [Step.ENCRYPT]: 100,
        [Step.PERSONAL_KEY]: 10,
        [Step.VERIFIED]: 1,
      };

      expect(toStepCounts(row)).to.deep.equal([
        { step: Step.WELCOME, count: 1e10, percentOfFirst: 1, percentOfPrevious: 1 },
        { step: Step.AGREEMENT, count: 1e9, percentOfFirst: 0.1, percentOfPrevious: 0.1 },
        { step: Step.CAPTURE_DOCUMENT, count: 1e8, percentOfFirst: 0.01, percentOfPrevious: 0.1 },
        { step: Step.CAP_DOC_SUBMIT, count: 1e7, percentOfFirst: 0.001, percentOfPrevious: 0.1 },
        { step: Step.SSN, count: 1e6, percentOfFirst: 1e-4, percentOfPrevious: 0.1 },
        { step: Step.VERIFY_INFO, count: 1e5, percentOfFirst: 1e-5, percentOfPrevious: 0.1 },
        { step: Step.VERIFY_SUBMIT, count: 1e4, percentOfFirst: 1e-6, percentOfPrevious: 0.1 },
        { step: Step.PHONE, count: 1000, percentOfFirst: 1e-7, percentOfPrevious: 0.1 },
        { step: Step.ENCRYPT, count: 100, percentOfFirst: 1e-8, percentOfPrevious: 0.1 },
        { step: Step.PERSONAL_KEY, count: 10, percentOfFirst: 1e-9, percentOfPrevious: 0.1 },
        { step: Step.VERIFIED, count: 1, percentOfFirst: 1e-10, percentOfPrevious: 0.1 },
      ]);
    });
  });
});
