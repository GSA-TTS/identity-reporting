import { VNode, ComponentChildren } from "preact";
import { useContext, useEffect, useRef, Inputs } from "preact/hooks";
import { utcDays, utcDay } from "d3-time";
import * as Plot from "@observablehq/plot";
import { format } from "d3-format";
import { useQuery } from "preact-fetching";
import { utcFormat } from "d3-time-format";
import { group, ascending, rollup } from "d3-array";
import { ReportFilterControlsContext } from "./report-filter-controls";
import Table, { TableData } from "./table";
import { path as reportPath } from "./report";

interface Result {
  count: number;

  ial: 1 | 2;

  issuer: string;

  /**
   * This is always present but we don't use it, so easier to mark as optional
   */
  iaa?: string;

  // eslint-disable-next-line camelcase
  friendly_name: string;

  agency: string;
}

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

export interface ProcessedResult extends Result {
  date: Date;
}

function process(report: DailyAuthsReportData): ProcessedResult[] {
  const date = new Date(report.start);
  return report.results.map((r) => ({ ...r, date, agency: r.agency || "(No Agency)" }));
}

function loadData(
  start: Date,
  finish: Date,
  env: string,
  fetch = window.fetch
): Promise<ProcessedResult[]> {
  return Promise.all(
    utcDays(start, finish, 1).map((date) => {
      const path = reportPath({ reportName: "daily-auths-report", date, env });
      return fetch(path).then((response) => response.json());
    })
  ).then((reports) => reports.flatMap((r) => process(r)));
}

const yearMonthDayFormat = utcFormat("%Y-%m-%d");

function tabulate(
  results?: ProcessedResult[],
  filterAgency?: string,
  filterIal?: number
): TableData {
  const filteredResults = (results || []).filter(
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
    .flatMap(([agency, issuers]) =>
      Array.from(issuers)
        .sort(([issuerA], [issuerB]) => ascending(issuerA, issuerB))
        .flatMap(([issuer, ials]) =>
          Array.from(ials).map(([ial, data]) => {
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
          })
        )
    );

  return {
    header,
    body,
  };
}

function tabulateSumByAgency(results?: ProcessedResult[], filterIal?: number): TableData {
  const filteredResults = (results || []).filter((d) => !filterIal || d.ial === filterIal);

  const days = Array.from(new Set(filteredResults.map((d) => d.date.valueOf())))
    .sort((a, b) => a - b)
    .map((d) => new Date(d));

  const rolledup = rollup(
    filteredResults,
    (bin) => bin.reduce((sum, d) => sum + d.count, 0),
    (d) => d.agency,
    (d) => d.ial,
    (d) => yearMonthDayFormat(d.date)
  );

  const header = ["Agency", "IAL", ...days.map(yearMonthDayFormat), "Total"];

  const body = Array.from(rolledup)
    .sort(([agencyA], [agencyB]) => ascending(agencyA, agencyB))
    .flatMap(([agency, ials]) =>
      Array.from(ials).map(([ial, ialDays]) => {
        const dayCounts = days.map((date) => ialDays.get(yearMonthDayFormat(date)) || 0);

        return [agency, String(ial), ...dayCounts, dayCounts.reduce((d, total) => d + total, 0)];
      })
    );

  return {
    header,
    body,
  };
}

function plot({
  start,
  finish,
  data,
  agency,
  ial,
  facetAgency,
}: {
  start: Date;
  finish: Date;
  data?: ProcessedResult[];
  agency?: string;
  ial: number;
  facetAgency?: boolean;
}): HTMLElement {
  return Plot.plot({
    height: facetAgency ? new Set((data || []).map((d) => d.agency)).size * 60 : undefined,
    y: {
      tickFormat: format(".1s"),
    },
    x: {
      domain: [start, finish],
    },
    facet: facetAgency
      ? {
          data: data || [],
          y: "agency",
          marginRight: 150,
        }
      : undefined,
    style: {},
    marks: [
      Plot.ruleY([0]),
      Plot.rectY(
        data || [],
        Plot.binX(
          {
            y: "sum",
          },
          {
            y: "count",
            x: {
              value: "date",
              thresholds: utcDay,
            },
            fill: agency ? "friendly_name" : "steelblue",
            title: agency ? (bin: ProcessedResult[]) => bin[0]?.friendly_name : undefined,
            filter: (d: ProcessedResult) => d.ial === ial && (!agency || d.agency === agency),
          }
        )
      ),
    ],
  });
}

interface PlotComponentProps {
  inputs: Inputs;
  plotter: () => HTMLElement;
  children?: ComponentChildren;
}

function PlotComponent({ plotter, inputs, children }: PlotComponentProps): VNode {
  const ref = useRef(null as HTMLDivElement | null);

  useEffect(() => {
    if (ref?.current?.children[0]) {
      ref.current.children[0].remove();
    }

    ref?.current?.appendChild(plotter());
  }, inputs);

  return (
    <div className="chart-wrapper" ref={ref}>
      {children}
    </div>
  );
}

function DailyAuthsReport(): VNode {
  const { start, finish, agency, ial, setAllAgencies, env } = useContext(
    ReportFilterControlsContext
  );

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

    // This needs to be in a separate effect from below because
    // this causes the <select> to refresh and triggers another change event
    // and a bunch of bad cycles
    setAllAgencies(allAgencies);
  }, [data]);

  return (
    <div>
      <div className="usa-accordion usa-accordion--bordered margin-bottom-2">
        <h3 className="usa-accordion__heading">
          <button
            className="usa-accordion__button"
            aria-controls="how-is-it-measured"
            aria-expanded="false"
            type="button"
          >
            How is this measured?
          </button>
        </h3>
        <div className="usa-prose usa-accordion__content" id="how-is-it-measured" hidden>
          <p>
            <strong>Timing: </strong>
            All data is collected, grouped, and displayed in the UTC timezone.
          </p>
          <p>
            <strong>Counting: </strong>
            This report displays the total number of authentications, so one user authenticating
            twice will count twice. It does not de-duplicate users or provide unique auths.
          </p>
        </div>
      </div>
      <PlotComponent
        plotter={() => plot({ data, ial, agency, start, finish })}
        inputs={[data, ial, agency, start.valueOf(), finish.valueOf()]}
      />
      {!agency && (
        <PlotComponent
          plotter={() => plot({ data, ial, start, finish, facetAgency: true })}
          inputs={[data, ial, start.valueOf(), finish.valueOf()]}
        />
      )}
      <Table
        data={agency ? tabulate(data, agency, ial) : tabulateSumByAgency(data, ial)}
        numberFormatter={format(",")}
      />
    </div>
  );
}

export default DailyAuthsReport;
export { tabulate, tabulateSumByAgency, loadData };
