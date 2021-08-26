import { path as reportPath } from "./report";
import { h, VNode } from "preact";
import { useContext, useEffect, useRef } from "preact/hooks";
import { ReportFilterControlsContext } from "./report-filter-controls";
import { utcDays } from "d3-time";
import * as Plot from "@observablehq/plot";
import { format } from "d3-format";
import { useQuery } from "preact-fetching";
import Table, { TableData } from "./table";
import { utcFormat } from "d3-time-format";
import { group, ascending } from "d3-array";

interface DailyAuthsReportData {
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

interface Result {
  count: number;

  ial: 1 | 2;

  issuer: string;

  /**
   * This is always present but we don't use it, so easier to mark as optional
   */
  iaa?: string;

  friendly_name: string;

  agency: string;
}

export interface ProcessedResult extends Result {
  date: Date;
}

function process(report: DailyAuthsReportData): ProcessedResult[] {
  const date = new Date(report.start);
  return report.results.map((r) => Object.assign({}, r, { date }));
}

function loadData(start: Date, finish: Date, fetch = window.fetch): Promise<ProcessedResult[]> {
  return Promise.all(
    utcDays(start, finish, 1).map((date) => {
      const path = reportPath({ reportName: "daily-auths-report", date });
      return fetch(path).then((response) => response.json());
    })
  ).then((reports) => reports.flatMap((r) => process(r)));
}

function tabulate(
  results: ProcessedResult[],
  filterAgency?: string,
  filterIal?: number
): TableData {
  const yearMonthDayFormat = utcFormat("%Y-%m-%d");

  const filteredResults = results.filter(
    (d) => (!filterAgency || d.agency === filterAgency) && (!filterIal || d.ial === filterIal)
  );

  const days = Array.from(new Set(filteredResults.map((d) => d.date.valueOf())))
    .sort((a, b) => a - b)
    .map((d) => new Date(d));

  const header = ["Agency", "App", "IAL", ...days.map(yearMonthDayFormat), "Total"];

  const grouped = group(
    filteredResults,
    (d) => d.agency,
    (d) => d.issuer,
    (d) => d.ial
  );

  const issuerToFriendlyName = new Map();
  filteredResults.forEach((d) => issuerToFriendlyName.set(d.issuer, d.friendly_name));

  const body = Array.from(grouped)
    .sort(([agencyA], [agencyB]) => ascending(agencyA, agencyB))
    .flatMap(([agency, issuers]) => {
      return Array.from(issuers)
        .sort(([issuerA], [issuerB]) => ascending(issuerA, issuerB))
        .flatMap(([issuer, ials]) => {
          return Array.from(ials).map(([ial, data]) => {
            const dayCounts = days.map(
              (date) => data.filter((d) => d.date.valueOf() === date.valueOf())?.[0]?.count ?? 0
            );

            return [
              agency,
              <span title={issuer}>{issuerToFriendlyName.get(issuer)}</span>,
              String(ial),
              ...dayCounts,
              dayCounts.reduce((d, total) => d + total, 0),
            ];
          });
        });
    });

  return {
    header,
    body,
    numberFormatter: format(","),
  };
}

function DailyAuthsReport(): VNode {
  const { start, finish, agency, ial, setAllAgencies } = useContext(ReportFilterControlsContext);
  const ref = useRef(null as HTMLDivElement | null);

  const { data } = useQuery(`${start.valueOf()}-${finish.valueOf()}`, () =>
    loadData(start, finish)
  );

  useEffect(() => {
    if (!data) {
      return;
    }

    const allAgencies = Array.from(new Set(data.map((d) => d.agency)))
      .filter((x) => !!x)
      .sort();

    // This needs to be in a separate effect from below because
    // this causes the <select> to refresh and triggers another change event
    // and a bunch of bad cycles
    setAllAgencies(allAgencies);
  }, [data]);

  useEffect(() => {
    if (ref?.current?.children[0]) {
      ref.current.children[0].remove();
    }

    ref?.current?.appendChild(
      Plot.plot({
        y: {
          tickFormat: format(".2s"),
        },
        style: {},
        marks: [
          Plot.ruleY([0]),
          Plot.barY(data || [], {
            x: "date",
            y: "count",
            fill: agency ? "friendly_name" : "agency",
            title: (d: ProcessedResult) => (agency ? d.friendly_name : d.agency),
            filter: (d: ProcessedResult) => d.ial === ial && (!agency || d.agency === agency),
          }),
        ],
      })
    );
  }, [data, ial, agency]);

  return (
    <div>
      <div class="chart-wrapper" ref={ref} />
      <Table data={tabulate(data || [], agency, ial)} />
    </div>
  );
}

export default DailyAuthsReport;
export { tabulate, loadData };
