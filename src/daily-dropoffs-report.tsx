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
import { csvParse, autoType } from "d3-dsv";

enum Mode {
  /**
   * Starts funnel at the welcome screen
   */
  OVERALL = "overall",
  /**
   * Starts funnel at the image submission screen
   */
  BLANKET = "blanket",
}

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

interface DailyDropoffsRow extends Record<Step, number> {
  issuer: string;
  // eslint-disable-next-line camelcase
  friendly_name: string;
  iaa: string;
  agency: string;
  start: Date;
  finish: Date;
}

const formatWithCommas = format(",");
const formatAsPercent = format(".0%");

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

/**
 * Sums up counts by day
 */
function aggregate(rows: DailyDropoffsRow[]): DailyDropoffsRow[] {
  return Array.from(group(rows, (d) => d.issuer))
    .sort(
      ([issuerA, binA], [issuerB, binB]) =>
        ascending(issuerA, issuerB) || ascending(binA[0].friendly_name, binB[0].friendly_name)
    )
    .map(([_start, bin]) => {
      const steps: Map<Step, number> = new Map();
      bin.forEach((row) => {
        STEP_TITLES.forEach(({ key }) => {
          const oldCount = steps.get(key) || 0;
          steps.set(key, row[key] + oldCount);
        });
      });

      const { issuer, friendly_name, iaa, agency, start, finish } = bin[0];

      return {
        issuer,
        friendly_name,
        iaa,
        agency,
        start,
        finish,
        ...Object.fromEntries(steps),
      } as DailyDropoffsRow;
    });
}

function tabulate({
  rows: results,
  filterAgency,
}: {
  rows?: DailyDropoffsRow[];
  filterAgency?: string;
}): TableData {
  const filteredRows = (results || []).filter((d) => !filterAgency || d.agency === filterAgency);

  const header = [
    "Agency",
    "App",
    ...STEP_TITLES.map(({ title }, idx) => <th colSpan={idx === 0 ? 1 : 2}>{title}</th>),
  ];

  const color = scaleLinear()
    .domain([1, 0])
    .range([
      // scaleLinear can interpolate string colors, but the 3rd party type annotations don't know that yet
      "steelblue" as unknown as number,
      "white" as unknown as number,
    ]);

  const body = filteredRows.map((row) => {
    const { agency, issuer, friendly_name } = row;

    return [
      agency,
      <span title={issuer}>{friendly_name}</span>,
      ...STEP_TITLES.flatMap(({ key }, idx) => {
        const count = row[key] || 0;
        let comparedToFirst = 1;

        if (idx > 0) {
          const firstCount = row[STEP_TITLES[0].key] || 0;
          comparedToFirst = count / firstCount;
        }

        const backgroundColor = `background-color: ${color(comparedToFirst)};`;

        const cells = [
          <td className="table-number text-tabular text-right" style={backgroundColor}>
            {formatWithCommas(count)}
          </td>,
        ];

        if (idx > 0) {
          cells.push(
            <td className="table-number text-tabular text-right" style={backgroundColor}>
              {formatAsPercent(comparedToFirst)}
            </td>
          );
        }

        return cells;
      }),
    ];
  });

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
        data={tabulate({ rows: data, filterAgency: agency })}
        numberFormatter={formatWithCommas}
      />
    </div>
  );
}

export default DailyDropffsReport;
export { tabulate };
