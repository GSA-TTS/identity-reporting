import { VNode } from "preact";
import { useContext, useRef, useState } from "preact/hooks";
import { utcDay } from "d3-time";
import * as Plot from "@observablehq/plot";
import { useQuery } from "preact-fetching";
import Markdown from "preact-markdown";
import { ascending, group, rollup } from "d3-array";
import { ReportFilterContext } from "../contexts/report-filter-context";
import Table, { TableData } from "./table";
import PlotComponent from "./plot";
import { useAgencies } from "../contexts/agencies-context";
import Accordion from "./accordion";
import useResizeListener from "../hooks/resize-listener";
import { ProcessedResult, loadData } from "../models/daily-auths-report-data";
import { formatSIDropTrailingZeroes, formatWithCommas, yearMonthDayFormat } from "../formats";

function plot({
  start,
  finish,
  data,
  agency,
  ial,
  facetAgency,
  width,
}: {
  start: Date;
  finish: Date;
  data?: ProcessedResult[];
  agency?: string;
  ial: number;
  facetAgency?: boolean;
  width?: number;
}): HTMLElement {
  return Plot.plot({
    height: facetAgency ? new Set((data || []).map((d) => d.agency)).size * 60 : undefined,
    width,
    y: {
      tickFormat: formatSIDropTrailingZeroes,
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
            title: (bin: ProcessedResult[]) => {
              const date = yearMonthDayFormat(bin[0].date);
              const total = formatWithCommas(bin.reduce((sum, d) => sum + d.count, 0));
              const friendlyName = bin[0]?.friendly_name;

              return [agency && `${friendlyName}:`, total, `(${date})`].filter(Boolean).join(" ");
            },
            filter: (d: ProcessedResult) => d.ial === ial && (!agency || d.agency === agency),
          }
        )
      ),
    ],
  });
}

function tabulate({
  results,
  filterAgency,
  filterIal,
}: {
  results?: ProcessedResult[];
  filterAgency?: string;
  filterIal?: number;
}): TableData {
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

function tabulateSumByAgency({
  results,
  filterIal,
  setParameters,
}: {
  results?: ProcessedResult[];
  filterIal?: number;
  setParameters: (params: Record<string, string>) => void;
}): TableData {
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

        return [
          <button
            type="button"
            className="usa-button usa-button--unstyled"
            onClick={() => setParameters({ agency })}
          >
            {agency}
          </button>,
          String(ial),
          ...dayCounts,
          dayCounts.reduce((d, total) => d + total, 0),
        ];
      })
    );

  return {
    header,
    body,
  };
}

function DailyAuthsReport(): VNode {
  const ref = useRef(null as HTMLDivElement | null);
  const [width, setWidth] = useState(undefined as number | undefined);
  const { start, finish, agency, ial, env, setParameters } = useContext(ReportFilterContext);

  const { data } = useQuery(`${start.valueOf()}-${finish.valueOf()}`, () =>
    loadData(start, finish, env)
  );

  useAgencies(data);
  useResizeListener(ref, () => setWidth(ref.current?.offsetWidth));

  return (
    <div ref={ref}>
      <Accordion title="How is this measured?">
        <Markdown
          markdown={`
**Timing**: All data is collected, grouped, and displayed in the UTC timezone.

**Counting**: This report displays the total number of authentications, so one user authenticating
twice will count twice. It does not de-duplicate users or provide unique auths.`}
        />
      </Accordion>
      <PlotComponent
        plotter={() => plot({ data, ial, agency, start, finish, width })}
        inputs={[data, ial, agency, start.valueOf(), finish.valueOf(), width]}
      />
      {!agency && (
        <PlotComponent
          plotter={() => plot({ data, ial, start, finish, width, facetAgency: true })}
          inputs={[data, ial, start.valueOf(), finish.valueOf(), width]}
        />
      )}
      <Table
        data={
          agency
            ? tabulate({ results: data, filterAgency: agency, filterIal: ial })
            : tabulateSumByAgency({ results: data, filterIal: ial, setParameters })
        }
        numberFormatter={formatWithCommas}
      />
    </div>
  );
}

export default DailyAuthsReport;
export { tabulate, tabulateSumByAgency };
