import { VNode } from "preact";
import { utcDay } from "d3-time";
import * as Plot from "@observablehq/plot";
import Markdown from "preact-markdown";
import { ascending, group, rollup } from "d3-array";
import { TableData } from "./table";
import { ProcessedResult } from "../models/daily-auths-report-data";
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
      domain: [start, utcDay.offset(finish, 1)],
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
            fill: agency ? "issuer" : "steelblue",
            title: ({ date, count, agency: binAgency }: ProcessedResult) => {
              const formattedDate = yearMonthDayFormat(date);
              const total = formatWithCommas(count);

              return [(agency || facetAgency) && binAgency, total, `(${formattedDate})`]
                .filter(Boolean)
                .join(" ");
            },
            filter: (d: ProcessedResult) => d.ial === ial && (!agency || d.agency === agency),
          }
        )
      ),
    ],
  });
}

function ialLabel(ial: 1 | 2): string {
  switch (ial) {
    case 1:
      return "Authentication";
    case 2:
      return "Proofing";
    default:
      throw new Error(`unknown level ${ial}`);
  }
}

function tabulate({ results }: { results: ProcessedResult[] }): TableData {
  const days = Array.from(new Set(results.map((d) => d.date.valueOf())))
    .sort((a, b) => a - b)
    .map((d) => new Date(d));

  const header = [
    "Agency",
    <span data-csv={["Issuer", "Friendly Name"]}>App</span>,
    "Identity",
    ...days.map(yearMonthDayFormat),
    "Total",
  ];

  const grouped = group(
    results,
    (d) => d.agency,
    (d) => d.issuer,
    (d) => d.ial
  );

  const issuerToFriendlyName = new Map();
  results.forEach((d) => issuerToFriendlyName.set(d.issuer, d.friendly_name));

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
              <td
                className="max-width-300 truncate-ellipsis"
                title={issuer}
                data-csv={[issuer, issuerToFriendlyName.get(issuer)]}
              >
                {issuerToFriendlyName.get(issuer)} <small>({issuer})</small>
              </td>,
              ialLabel(ial),
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
  setParameters,
}: {
  results: ProcessedResult[];
  setParameters: (params: Record<string, string>) => void;
}): TableData {
  const days = Array.from(new Set(results.map((d) => d.date.valueOf())))
    .sort((a, b) => a - b)
    .map((d) => new Date(d));

  const rolledup = rollup(
    results,
    (bin) => bin.reduce((sum, d) => sum + d.count, 0),
    (d) => d.agency,
    (d) => d.ial,
    (d) => yearMonthDayFormat(d.date)
  );

  const header = ["Agency", "Identity", ...days.map(yearMonthDayFormat), "Total"];

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
          ialLabel(ial),
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

function tabulateSum({ results }: { results: ProcessedResult[] }): TableData {
  const days = Array.from(new Set(results.map((d) => d.date.valueOf())))
    .sort((a, b) => a - b)
    .map((d) => new Date(d));

  const rolledup = rollup(
    results,
    (bin) => bin.reduce((sum, d) => sum + d.count, 0),
    (d) => d.ial,
    (d) => yearMonthDayFormat(d.date)
  );

  const header = ["Agency", "Identity", ...days.map(yearMonthDayFormat), "Total"];

  const body = Array.from(rolledup)
    .sort(([ialA], [ialB]) => ascending(ialA, ialB))
    .map(([ial, ialDays]) => {
      const dayCounts = days.map((date) => ialDays.get(yearMonthDayFormat(date)) || 0);

      return ["(all)", ialLabel(ial), ...dayCounts, dayCounts.reduce((d, total) => d + total, 0)];
    });

  return {
    header,
    body,
  };
}

function DailyAuthsReport(): VNode {
  return (
    <div className="padding-bottom-5">
      <Markdown
        markdown={`
## This Report is Unavailable Right Now

We're investigating inconsistencies in the underlying data.
`}
      />
    </div>
  );
}

export default DailyAuthsReport;
export { plot, tabulate, tabulateSum, tabulateSumByAgency };
