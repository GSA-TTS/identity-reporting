import { VNode } from "preact";
import { useQuery } from "preact-fetching";
import { useRef, useState, useContext } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import Markdown from "preact-markdown";
import { ReportFilterContext } from "../contexts/report-filter-context";
import useResizeListener from "../hooks/resize-listener";
import {
  DataType,
  loadData,
  ProcessedResult,
  ProcessedRenderableData,
  toRenderableData,
} from "../models/daily-registrations-report-data";
import PlotComponent from "./plot";
import { formatSIDropTrailingZeroes, formatWithCommas, yearMonthDayFormat } from "../formats";
import Table, { TableData } from "./table";
import Accordion from "./accordion";

function plot({ data, width }: { data: ProcessedRenderableData[]; width?: number }): HTMLElement {
  return Plot.plot({
    color: {
      legend: true,
      type: "ordinal",
      tickFormat: (type: DataType): string => {
        switch (type) {
          case DataType.TOTAL_USERS:
          case DataType.TOTAL_USERS_CUMULATIVE:
            return "Total Users";
          case DataType.FULLY_REGISTERED_USERS:
          case DataType.FULLY_REGISTERED_USERS_CUMULATIVE:
            return "Full Registered Users";
          default:
            throw new Error(`Unknown type ${type}`);
        }
      },
    },
    marks: [
      Plot.ruleY([0]),
      Plot.line(data, {
        x: "date",
        y: "value",
        z: "type",
        stroke: "type",
      }),
    ],
    width,
    y: {
      tickFormat: formatSIDropTrailingZeroes,
    },
  });
}

/**
 * Assumes that results is pre-sorted, pre-filtered
 */
function tabulate(results: ProcessedResult[]): TableData {
  return {
    header: ["", ...results.map(({ date }) => yearMonthDayFormat(date))],
    body: [
      ["New Users", ...results.map(({ totalUsers }) => totalUsers)],
      [
        "New Fully Registered Users",
        ...results.map(({ fullyRegisteredUsers }) => fullyRegisteredUsers),
      ],
      ["Cumulative Users", ...results.map(({ totalUsersCumulative }) => totalUsersCumulative)],
      [
        "Cumulative Fully Registered Users",
        ...results.map(({ fullyRegisteredUsersCumulative }) => fullyRegisteredUsersCumulative),
      ],
    ],
  };
}

function DailyRegistrationsReport(): VNode {
  const ref = useRef(null as HTMLDivElement | null);
  const [width, setWidth] = useState(undefined as number | undefined);
  useResizeListener(() => setWidth(ref.current?.offsetWidth));
  const { start, finish, env, cumulative } = useContext(ReportFilterContext);

  const { data } = useQuery(`daily-registrations-${finish.valueOf()}`, () => loadData(finish, env));

  const filteredData =
    data &&
    toRenderableData(data).filter(({ type }) => {
      switch (type) {
        case DataType.TOTAL_USERS:
        case DataType.FULLY_REGISTERED_USERS:
          return !cumulative;
        case DataType.TOTAL_USERS_CUMULATIVE:
        case DataType.FULLY_REGISTERED_USERS_CUMULATIVE:
          return !!cumulative;
        default:
          throw new Error(`Unknown data type ${type}`);
      }
    });

  const windowedData = data && data.filter(({ date }) => start <= date && date <= finish);

  return (
    <div ref={ref}>
      <Accordion title="How is this measured?">
        <Markdown
          markdown={`
**Timing**: All data is collected, grouped, and displayed in the UTC timezone.

**Definitions**
- **New Users**: Number of accounts created, only looking at submitting an email address
- **Fully Registered Users**: Number of accounts created that have verified an email address and
  added (and confirmed) a second factor`}
        />
      </Accordion>
      {filteredData && (
        <PlotComponent
          plotter={() => plot({ data: filteredData, width })}
          inputs={[data, width, cumulative]}
        />
      )}
      {windowedData && <Table numberFormatter={formatWithCommas} data={tabulate(windowedData)} />}
    </div>
  );
}

export default DailyRegistrationsReport;
export { tabulate };
