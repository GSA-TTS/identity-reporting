import { VNode } from "preact";
import { useContext, useRef, useState } from "preact/hooks";
import { useQuery } from "preact-fetching";
import { scaleLinear, scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import Markdown from "preact-markdown";
import { ascending } from "d3-array";
import { ReportFilterContext } from "../contexts/report-filter-context";
import Table, { TableData } from "./table";
import { useAgencies } from "../contexts/agencies-context";
import Accordion from "./accordion";
import useResizeListener from "../hooks/resize-listener";
import DailyDropoffsLineChart from "./daily-dropoffs-line-chart";
import {
  DailyDropoffsRow,
  FunnelMode,
  funnelSteps,
  loadData,
  toStepCounts,
} from "../models/daily-dropoffs-report-data";
import { formatAsPercent, formatWithCommas } from "../formats";

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
    "App",
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

  const body = rows.map((row) => {
    const { agency, issuer, friendly_name: friendlyName } = row;

    return [
      agency,
      <span title={issuer}>
        <span style={`color: ${issuerColor(issuer)}`}>⬤ </span>
        {friendlyName}
      </span>,
      ...toStepCounts(row, funnelMode).flatMap(({ count, percentOfFirst }, idx) => {
        const backgroundColor = `background-color: ${color(percentOfFirst)};`;
        const cells = [
          <td className="table-number text-tabular text-right" style={backgroundColor}>
            {formatWithCommas(count)}
          </td>,
        ];

        if (idx > 0) {
          cells.push(
            <td className="table-number text-tabular text-right" style={backgroundColor}>
              {formatAsPercent(percentOfFirst)}
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
  const ref = useRef(null as HTMLDivElement | null);
  const [width, setWidth] = useState(undefined as number | undefined);
  const { start, finish, agency, env, funnelMode } = useContext(ReportFilterContext);

  const { data } = useQuery(`dropoffs/${start.valueOf()}-${finish.valueOf()}`, () =>
    loadData(start, finish, env)
  );

  const issuerColor = scaleOrdinal(schemeCategory10);

  useResizeListener(ref, () => setWidth(ref.current?.offsetWidth));
  useAgencies(data);

  const filteredData = (data || []).filter((d) => !agency || d.agency === agency);

  return (
    <div ref={ref}>
      <Accordion title="How is this measured?">
        <Markdown
          markdown={`
**Definitions**:

- *Blanket*: The funnel starts at the image submit step
- *Overall*: The funnel starts at the welcome step

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
      />
      <Table
        data={tabulate({ rows: filteredData, issuerColor, funnelMode })}
        numberFormatter={formatWithCommas}
      />
    </div>
  );
}

export default DailyDropffsReport;
export { tabulate };
