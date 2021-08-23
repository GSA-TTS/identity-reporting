import { path as reportPath } from "./report.js";
import { html } from "htm/preact";
import { useContext, useEffect, useRef } from "preact/hooks";
import { ReportFilterControlsContext } from "./report-filter-controls";
import { utcDays } from "d3-time";
import * as Plot from "@observablehq/plot";
import { format } from "d3-format";
import { useQuery } from "preact-fetching";
import Table from "./table.js";
import { utcFormat } from "d3-time-format";
import { group, ascending } from "d3-array";

/**
 * @typedef DailyAuthsReportData
 * @property {Result[]} results
 * @property {string} start ISO8601 string
 * @property {string} finish ISO8601 string
 */

/**
 * @typedef Result
 * @property {number} count
 * @property {1|2} ial
 * @property {string} issuer
 * @property {string=} iaa This is always present but we don't use it, so easier to mark as optional
 * @property {string} friendly_name
 * @property {string} agency
 */

/**
 * @typedef {Result & { date: Date } } ProcessedResult
 */

/**
 * @param {DailyAuthsReportData} report
 * @returns {ProcessedResult[]}
 */
function process(report) {
  const date = new Date(Date.parse(report.start));
  return report.results.map((r) => Object.assign({}, r, { date }));
}

/**
 * @param {Date} start
 * @param {Date} finish
 * @return {Promise<ProcessedResult[]>}
 */
function loadData(start, finish, fetch = window.fetch) {
  return Promise.all(
    utcDays(start, finish, 1).map((date) => {
      const path = reportPath({ reportName: "daily-auths-report", date });
      return fetch(path).then((response) => response.json());
    })
  ).then((reports) => reports.flatMap((r) => process(r)));
}

/**
 * @param {ProcessedResult[]} results
 * @param {string=} filterAgency
 * @param {number=} filterIal
 * @return {import('./table').TableData}
 */
function tabulate(results, filterAgency, filterIal) {
  const yearMonthDayFormat = utcFormat("%Y-%m-%d");

  const filteredResults = results.filter(
    (d) => (!filterAgency || d.agency == filterAgency) && (!filterIal || d.ial == filterIal)
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
              (date) => data.filter((d) => d.date.valueOf() == date.valueOf())?.[0]?.count ?? 0
            );

            return [
              agency,
              html`<span title=${issuer}>${issuerToFriendlyName.get(issuer)}</span>`,
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

/**
 * @returns {import('preact').VNode}
 */
function DailyAuthsReport({}) {
  const { start, finish, agency, ial, setAllAgencies } = useContext(ReportFilterControlsContext);
  const ref = useRef();

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
    setAllAgencies(allAgencies);

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
          Plot.barY(data, {
            x: "date",
            y: "count",
            fill: agency ? "friendly_name" : "agency",
            title: (/** @type ProcessedResult */ d) => (agency ? d.friendly_name : d.agency),
            filter: (/** @type ProcessedResult */ d) =>
              d.ial == ial && (!agency || d.agency == agency),
          }),
        ],
      })
    );
  }, [data]);

  return html` <div>
    <div class="chart-wrapper" ref=${ref} />
    <${Table} data=${tabulate(data || [], agency, ial)} />
  </div>`;
}

export default DailyAuthsReport;
export { tabulate, loadData };
