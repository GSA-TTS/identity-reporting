import { VNode } from "preact";
import { useContext, useEffect } from "preact/hooks";
import { utcDays } from "d3-time";
import { useQuery } from "preact-fetching";
import { format } from "d3-format";
import { group, ascending } from "d3-array";
import { AgenciesContext } from "./context/agencies-context";
import Table, { TableData } from "./table";
import { ReportFilterContext } from "./context/report-filter-context";
import { path as reportPath } from "./report";
import { scaleLinear } from "d3-scale";

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

const STEP_TITLES = [
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

interface StepCount {
  name: Step;
  count: number;
}

interface Result {
  steps: StepCount[];
  issuer: string;
  /**
   * This is always present but we don't use it, so easier to mark as optional
   */
  iaa?: string;
  // eslint-disable-next-line camelcase
  friendly_name: string;
  agency: string;
}

interface DailyDropoffsReportData {
  results: Result[];

  /**
   * ISO8601 string
   */
  start: string;

  /**
   * ISO8601 string
   */
  finish: string;
}

export interface ProcessedResult extends Result {
  date: Date;
}

const formatWithCommas = format(",");
const formatAsPercent = format(".0%");

function process({ start, results }: DailyDropoffsReportData): ProcessedResult[] {
  const date = new Date(start);
  return results.map((r) => ({
    ...r,
    date,
    issuer: r.issuer || "(No Issuer)",
    agency: r.agency || "(No Agency)",
    friendly_name: r.friendly_name || "(No App)",
  }));
}

function loadData(
  start: Date,
  finish: Date,
  env: string,
  fetch = window.fetch
): Promise<ProcessedResult[]> {
  return Promise.all(
    utcDays(start, finish, 1).map((date) => {
      const path = reportPath({ reportName: "daily-dropoffs-report", date, env });
      return fetch(path).then((response) => response.json());
    })
  ).then((reports) => reports.flatMap((r) => process(r)));
}

function tabulate({
  results,
  filterAgency,
}: {
  results?: ProcessedResult[];
  filterAgency?: string;
}): TableData {
  const filteredResults = (results || []).filter((d) => !filterAgency || d.agency === filterAgency);

  const header = [
    "Agency",
    "App",
    ...STEP_TITLES.map(({ title }, idx) => <th colSpan={idx === 0 ? 1 : 2}>{title}</th>),
  ];

  const issuerToFriendlyName = new Map();
  const issuerToStep: Map<string, Map<Step, number>> = new Map();

  filteredResults.forEach((d) => {
    issuerToFriendlyName.set(d.issuer, d.friendly_name);
    issuerToStep.set(d.issuer, new Map());
  });

  filteredResults.forEach((d) => {
    const stepMap = issuerToStep.get(d.issuer) || new Map();

    d.steps.forEach(({ name, count }) => {
      const oldCount = stepMap.get(name) || 0;
      stepMap.set(name, oldCount + count);
    });
  });

  const grouped = group(
    filteredResults,
    (d) => d.agency,
    (d) => d.issuer
  );

  const color = scaleLinear()
    .domain([1, 0])
    .range([
      // scaleLinear can interpolate string colors, but the 3rd party type annotations don't know that yet
      "steelblue" as unknown as number,
      "white" as unknown as number,
    ]);

  const body = Array.from(grouped)
    .sort(([agencyA], [agencyB]) => ascending(agencyA, agencyB))
    .flatMap(([agency, issuers]) =>
      Array.from(issuers)
        .sort(([issuerA], [issuerB]) => ascending(issuerA, issuerB))
        .map(([issuer]) => {
          const stepCounts = issuerToStep.get(issuer);
          return [
            agency,
            <span title={issuer}>{issuerToFriendlyName.get(issuer)}</span>,
            ...STEP_TITLES.flatMap(({ key }, idx) => {
              const count = stepCounts?.get(key) || 0;
              let comparedToFirst = 1;

              if (idx > 0) {
                const firstCount = stepCounts?.get(STEP_TITLES[0].key) || 0;
                comparedToFirst = count / firstCount;
              }

              const backgroundColor = `background-color: ${color(comparedToFirst)};`;

              const cells = [
                <td className="table-number text-tabular text-right" style={backgroundColor}>
                  {formatWithCommas(count)}
                </td>,
                idx > 0 && (
                  <td className="table-number text-tabular text-right" style={backgroundColor}>
                    {formatAsPercent(comparedToFirst)}
                  </td>
                ),
              ].filter(Boolean);

              return cells;
            }),
          ];
        })
    );

  return {
    header,
    body,
  };
}

function DailyDropffsReport(): VNode {
  const { setAgencies } = useContext(AgenciesContext);
  const { start, finish, agency, env } = useContext(ReportFilterContext);

  const { data } = useQuery(`${start.valueOf()}-${finish.valueOf()}`, () =>
    loadData(start, finish, env)
  );

  useEffect(() => {
    if (!data) {
      return;
    }

    const allAgencies = Array.from(new Set(data.map((d) => d.agency)))
      .filter((x) => !!x)
      .sort();

    setAgencies(allAgencies);
  }, [data]);

  return (
    <>
      <Table
        data={tabulate({ results: data, filterAgency: agency })}
        numberFormatter={formatWithCommas}
      />
    </>
  );
}

export default DailyDropffsReport;
export { tabulate };
