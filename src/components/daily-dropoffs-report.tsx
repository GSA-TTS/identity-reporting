import { VNode } from "preact";
import { useContext, useRef, useState } from "preact/hooks";
import { useQuery } from "preact-fetching";
import { scaleLinear, scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import Markdown from "preact-markdown";
import { ascending, max, min } from "d3-array";
import { FunnelMode, ReportFilterContext } from "../contexts/report-filter-context";
import Table, { TableData } from "./table";
import { useAgencies } from "../contexts/agencies-context";
import Accordion from "./accordion";
import useResizeListener from "../hooks/resize-listener";
import DailyDropoffsLineChart from "./daily-dropoffs-line-chart";
import {
  DailyDropoffsRow,
  funnelSteps,
  loadData,
  toStepCounts,
  aggregateAll,
  aggregate,
  overlappingBadData,
  stepToTitle,
} from "../models/daily-dropoffs-report-data";
import {
  formatAsPercent,
  formatWithCommas,
  formatWithWeekday,
  yearMonthDayFormat,
} from "../formats";
import Alert from "./alert";

function tabulate({
  rows: unsortedRows,
  funnelMode,
  issuerColor,
}: {
  rows: DailyDropoffsRow[];
  funnelMode: FunnelMode;
  issuerColor: (issuer: string) => string;
}): TableData {
  const rows = unsortedRows.sort(
    (
      { agency: agencyA, friendly_name: friendlyNameA },
      { agency: agencyB, friendly_name: friendlyNameB }
    ) => ascending(agencyA, agencyB) || ascending(friendlyNameA, friendlyNameB)
  );

  const header = [
    "Agency",
    <span data-csv={["Issuer", "Friendly Name"]}>App</span>,
    ...funnelSteps(funnelMode).map(({ title }, idx) => (
      <th colSpan={idx === 0 ? 1 : 2}>{title}</th>
    )),
  ];

  const color = scaleLinear()
    .domain([1, 0])
    .range([
      // scaleLinear can interpolate string colors, but the 3rd party type annotations don't know that yet
      "steelblue" as unknown as number,
      "white" as unknown as number,
    ]);

  const totals = funnelSteps(funnelMode).map(() => 0);

  const body = rows.map((row) => {
    const { agency, issuer, friendly_name: friendlyName } = row;

    return [
      agency,
      <span title={issuer} data-csv={[issuer, friendlyName]}>
        <span style={`color: ${issuerColor(issuer)}`}>⬤ </span>
        {friendlyName}
      </span>,
      ...toStepCounts(row, funnelMode).flatMap(({ count, percentOfFirst }, idx) => {
        const backgroundColor = `background-color: ${color(percentOfFirst)};`;
        const cells = [
          <td
            data-csv={count}
            className="table-number text-tabular text-right"
            style={backgroundColor}
          >
            {formatWithCommas(count)}
          </td>,
        ];

        if (idx > 0) {
          cells.push(
            <td
              data-csv={percentOfFirst}
              className="table-number text-tabular text-right"
              style={backgroundColor}
            >
              {formatAsPercent(percentOfFirst)}
            </td>
          );
        }

        totals[idx] += count;

        return cells;
      }),
    ];
  });

  return {
    header,
    body,
    footer: [
      "Total",
      "",
      ...totals
        .flatMap((total, idx) =>
          idx > 0 ? [formatWithCommas(total), ""] : formatWithCommas(total)
        )
        .map((d) => <td className="table-number text-tabular text-right">{d}</td>),
    ],
  };
}

function DailyDropffsReport(): VNode {
  const ref = useRef(null as HTMLDivElement | null);
  const [width, setWidth] = useState(undefined as number | undefined);
  const { byAgency, start, finish, agency, env, funnelMode, scale } =
    useContext(ReportFilterContext);

  const { data } = useQuery(`dropoffs/${start.valueOf()}-${finish.valueOf()}`, () =>
    loadData(start, finish, env)
  );

  const issuerColor = scaleOrdinal(schemeCategory10);

  useResizeListener(() => setWidth(ref.current?.offsetWidth));
  useAgencies(data);

  const nonNullData = aggregate(data || []);
  const filteredData = (byAgency ? nonNullData : aggregateAll(nonNullData)).filter(
    (d) => !agency || d.agency === agency
  );

  const badData = overlappingBadData(start, finish);
  const showAlert = badData.length > 0;
  const badSteps = Array.from(new Set(badData.flatMap(({ steps }) => steps)));

  return (
    <div ref={ref}>
      {showAlert && (
        <Alert level="error" className="margin-y-2" title="Unreliable Data">
          Due to errors in the underlying data, this report is not accurate between{" "}
          {formatWithWeekday(min(badData, (d) => d.start) as Date)} and{" "}
          {formatWithWeekday(max(badData, (d) => d.finish) as Date)}, specifically at these steps:
          <ul>
            {badSteps.map((s) => (
              <li>{stepToTitle(s)}</li>
            ))}
          </ul>
        </Alert>
      )}
      <Accordion title="How is this measured?">
        <Markdown
          markdown={`
**Timing**: All data is collected, grouped, and displayed in the UTC timezone.

**Known Limitations**:

The data model table can't accurately capture:
- Users who become verified on a different day than the day they start proofing (such as verify by mail)
- Users who attempt proofing at one partner app, and reattempt with a different partner app.
`}
        />
      </Accordion>
      <DailyDropoffsLineChart
        data={filteredData}
        width={width}
        color={issuerColor}
        funnelMode={funnelMode}
        scale={scale}
        badSteps={badSteps}
      />
      <Table
        data={tabulate({ rows: filteredData, issuerColor, funnelMode })}
        numberFormatter={formatWithCommas}
        filename={`daily-dropoffs-report-${yearMonthDayFormat(start)}-to-${yearMonthDayFormat(
          finish
        )}.csv`}
      />
    </div>
  );
}

export default DailyDropffsReport;
export { tabulate };
