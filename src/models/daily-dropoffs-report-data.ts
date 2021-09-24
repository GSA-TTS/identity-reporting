import { group, ascending } from "d3-array";
import { csvParse, autoType } from "d3-dsv";
import { utcDays } from "d3-time";
import { FunnelMode } from "../contexts/report-filter-context";
import { path as reportPath } from "../reports/path";

enum Step {
  WELCOME = "welcome",
  AGREEMENT = "agreement",
  CAPTURE_DOCUMENT = "capture_document",
  CAP_DOC_SUBMIT = "cap_doc_submit",
  SSN = "ssn",
  VERIFY_INFO = "verify_info",
  VERIFY_SUBMIT = "verify_submit",
  PHONE = "phone",
  ENCRYPT = "encrypt",
  PERSONAL_KEY = "personal_key",
  VERIFIED = "verified",
}

interface StepTitle {
  key: Step;
  title: string;
}

const STEPS: StepTitle[] = [
  { key: Step.WELCOME, title: "Welcome" },
  { key: Step.AGREEMENT, title: "Agreement" },
  { key: Step.CAPTURE_DOCUMENT, title: "Capture Document" },
  { key: Step.CAP_DOC_SUBMIT, title: "Submit Document" },
  { key: Step.SSN, title: "SSN" },
  { key: Step.VERIFY_INFO, title: "Verify Info" },
  { key: Step.VERIFY_SUBMIT, title: "Verify Submit" },
  { key: Step.PHONE, title: "Phone" },
  { key: Step.ENCRYPT, title: "Encrypt" },
  { key: Step.PERSONAL_KEY, title: "Personal Key" },
  { key: Step.VERIFIED, title: "Verified" },
];

function stepToTitle(step: Step): string {
  return STEPS.find(({ key }) => key === step)?.title || "";
}

interface DailyDropoffsRow extends Record<Step, number> {
  issuer: string;
  // eslint-disable-next-line camelcase
  friendly_name: string;
  iaa: string;
  agency: string;
  start: Date;
  finish: Date;
}

function process(str: string): DailyDropoffsRow[] {
  return csvParse(str, autoType).map((parsedRow) => {
    const r = parsedRow as DailyDropoffsRow;
    return {
      ...r,
      issuer: r.issuer || "(No Issuer)",
      agency: r.agency || "(No Agency)",
      friendly_name: r.friendly_name || "(No App)",
    };
  });
}

function funnelSteps(funnelMode: FunnelMode): StepTitle[] {
  return funnelMode === FunnelMode.OVERALL ? STEPS : STEPS.slice(3);
}

interface StepCount {
  step: Step;
  count: number;
  /**
   * compare to step[0]
   */
  percentOfFirst: number;
  /**
   * compare to step[n - 1]
   */
  percentOfPrevious: number;
}

function toStepCounts(row: DailyDropoffsRow, funnelMode: FunnelMode): StepCount[] {
  const steps = funnelSteps(funnelMode);

  const firstCount = row[steps[0].key] || 0;

  return steps.map(({ key }, idx) => {
    const count = row[key] || 0;
    const prevCount = idx > 0 ? row[steps[idx - 1].key] || 0 : firstCount;

    return {
      step: key,
      count,
      percentOfFirst: count / firstCount || 0, // guard against NaN from divide by zero
      percentOfPrevious: count / prevCount || 0,
    };
  });
}

/**
 * Sums up counts by day
 */
function aggregate(rows: DailyDropoffsRow[]): DailyDropoffsRow[] {
  return Array.from(group(rows, (d) => d.issuer))
    .sort(
      ([issuerA, binA], [issuerB, binB]) =>
        ascending(issuerA, issuerB) || ascending(binA[0].friendly_name, binB[0].friendly_name)
    )
    .map(([, bin]) => {
      const steps: Map<Step, number> = new Map();
      bin.forEach((row) => {
        STEPS.forEach(({ key }) => {
          const oldCount = steps.get(key) || 0;
          steps.set(key, (row[key] || 0) + oldCount);
        });
      });

      const { issuer, friendly_name: friendlyName, iaa, agency, start, finish } = bin[0];

      return {
        issuer,
        friendly_name: friendlyName,
        iaa,
        agency,
        start,
        finish,
        ...Object.fromEntries(steps),
      } as DailyDropoffsRow;
    });
}

function loadData(
  start: Date,
  finish: Date,
  env: string,
  fetch = window.fetch
): Promise<DailyDropoffsRow[]> {
  return Promise.all(
    utcDays(start, finish, 1).map((date) => {
      const path = reportPath({ reportName: "daily-dropoffs-report", date, env, extension: "csv" });
      return fetch(path).then((response) => response.text());
    })
  ).then((reports) => aggregate(reports.flatMap((r) => process(r))));
}

export {
  DailyDropoffsRow,
  Step,
  StepCount,
  stepToTitle,
  loadData,
  aggregate,
  funnelSteps,
  toStepCounts,
};
