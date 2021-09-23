import { VNode } from "preact";
import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { utcDays } from "d3-time";
import { useQuery } from "preact-fetching";
import { format } from "d3-format";
import { group, ascending, max } from "d3-array";
import { scalePoint, scaleLinear, scaleOrdinal, NumberValue } from "d3-scale";
import { csvParse, autoType } from "d3-dsv";
import { line as d3Line } from "d3-shape";
import { select } from "d3-selection";
import { Axis as D3Axis, axisBottom, axisLeft } from "d3-axis";
import { schemeCategory10 } from "d3-scale-chromatic";
import { path as reportPath } from "./report";
import { ReportFilterContext } from "./context/report-filter-context";
import Table, { TableData } from "./table";
import { AgenciesContext } from "./context/agencies-context";

// enum Mode {
//   /**
//    * Starts funnel at the welcome screen
//    */
//   OVERALL = "overall",
//   /**
//    * Starts funnel at the image submission screen
//    */
//   BLANKET = "blanket",
// }

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

const STEPS = [
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

function stepToTitle(step: Step): string {
  return STEPS.find(({ key }) => key === step)?.title || "";
}

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

/**
 * Sums up counts by day
 */
function aggregate(rows: DailyDropoffsRow[]): DailyDropoffsRow[] {
  return Array.from(group(rows, (d) => d.issuer))
    .sort(
      ([issuerA, binA], [issuerB, binB]) =>
        ascending(issuerA, issuerB) || ascending(binA[0].friendly_name, binB[0].friendly_name)
    )
    .map(([, bin]) => {
      const steps: Map<Step, number> = new Map();
      bin.forEach((row) => {
        STEPS.forEach(({ key }) => {
          const oldCount = steps.get(key) || 0;
          steps.set(key, row[key] + oldCount);
        });
      });

      // eslint-disable-next-line camelcase
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
  issuerColor,
}: {
  rows?: DailyDropoffsRow[];
  filterAgency?: string;
  issuerColor: (issuer: string) => string;
}): TableData {
  const filteredRows = (results || []).filter((d) => !filterAgency || d.agency === filterAgency);

  const header = [
    "Agency",
    "App",
    ...STEPS.map(({ title }, idx) => <th colSpan={idx === 0 ? 1 : 2}>{title}</th>),
  ];

  const color = scaleLinear()
    .domain([1, 0])
    .range([
      // scaleLinear can interpolate string colors, but the 3rd party type annotations don't know that yet
      "steelblue" as unknown as number,
      "white" as unknown as number,
    ]);

  const body = filteredRows.map((row) => {
    // eslint-disable-next-line camelcase
    const { agency, issuer, friendly_name } = row;

    return [
      agency,
      <span title={issuer}>
        <span style={`color: ${issuerColor(issuer)}`}>⬤ </span>
        {/* eslint-disable-next-line camelcase */}
        {friendly_name}
      </span>,
      ...STEPS.flatMap(({ key }, idx) => {
        const count = row[key] || 0;
        let comparedToFirst = 1;

        if (idx > 0) {
          const firstCount = row[STEPS[0].key] || 0;
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

interface StepCount {
  step: Step;
  count: number;
}

function toStepCounts(row: DailyDropoffsRow): StepCount[] {
  return STEPS.map(({ key }) => ({
    step: key,
    count: row[key],
  }));
}

function Axis({
  axis,
  transform,
  rotateLabels,
  className,
}: {
  axis: D3Axis<NumberValue> | D3Axis<string>;
  transform: string;
  rotateLabels?: boolean;
  className?: string;
}): VNode {
  const ref = useRef(null as SVGGElement | null);

  useEffect(() => {
    if (ref.current) {
      select(ref.current).call(axis).classed("rotate-labels", !!rotateLabels);
    }
  });

  return <g ref={ref} className={className} transform={transform} />;
}

function LineChart({
  data,
  color,
  width = 400,
  height = 400,
}: {
  data: DailyDropoffsRow[];
  color: (issuer: string) => string;
  width?: number;
  height?: number;
}): VNode {
  const margin = {
    top: 20,
    right: 50,
    bottom: 50,
    left: 50,
  };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const ref = useRef(null as SVGSVGElement | null);

  const x = scalePoint()
    .domain(STEPS.map(({ key }) => key))
    .range([0, innerWidth]);

  const y = scaleLinear()
    .domain([0, max(data || [], (d) => d.welcome) as number])
    .range([innerHeight, 0]);

  const line = d3Line()
    .x((d) => x((d as unknown as StepCount).step) as number)
    .y((d) => y((d as unknown as StepCount).count) as number) as (s: StepCount[]) => string;

  return (
    <svg ref={ref} height={height} width={width}>
      <Axis axis={axisLeft(y)} transform={`translate(${margin.left}, ${margin.top})`} />
      <Axis
        axis={axisBottom(x).tickFormat(stepToTitle as (s: string) => string)}
        transform={`translate(${margin.left}, ${margin.top + innerHeight})`}
        className="x-axis"
        rotateLabels={width < 700}
      />
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {(data || []).map((row) => (
          <path
            d={line(toStepCounts(row))}
            fill="none"
            stroke={color(row.issuer)}
            strokeWidth="1"
            onMouseEnter={() =>
              ref.current &&
              select(ref.current)
                .selectAll(".dots")
                .attr("hidden", function () {
                  const elem = this as SVGGElement;
                  return elem.dataset.issuer === row.issuer ? null : false;
                })
            }
          />
        ))}
      </g>
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {(data || []).map((row) => (
          <g className="dots" hidden data-issuer={row.issuer}>
            {toStepCounts(row).map(({ step, count }, idx, stepCounts) => {
              let comparedToFirst = 0;
              if (idx > 0) {
                comparedToFirst = count / stepCounts[0].count;
              }

              return (
                <>
                  <circle cx={x(step)} cy={y(count)} r="3" fill={color(row.issuer)} />
                  <text x={x(step)} y={y(count)} fontSize="12" dx="3" dy="-3">
                    <tspan x={x(step)}>{formatWithCommas(count)}</tspan>
                    {idx > 0 && (
                      <tspan x={x(step)} dy="1.2em">
                        (${formatAsPercent(comparedToFirst)})
                      </tspan>
                    )}
                  </text>
                </>
              );
            })}
          </g>
        ))}
      </g>
    </svg>
  );
}

function DailyDropffsReport(): VNode {
  const ref = useRef(null as HTMLDivElement | null);
  const [width, setWidth] = useState(undefined as number | undefined);
  const { setAgencies } = useContext(AgenciesContext);
  const { start, finish, agency, env } = useContext(ReportFilterContext);

  const { data } = useQuery(`${start.valueOf()}-${finish.valueOf()}`, () =>
    loadData(start, finish, env)
  );

  const issuerColor = scaleOrdinal(schemeCategory10);

  useEffect(() => {
    if (!data) {
      return;
    }

    const allAgencies = Array.from(new Set(data.map((d) => d.agency)))
      .filter((x) => !!x)
      .sort();

    setAgencies(allAgencies);
  }, [data]);

  useEffect(() => {
    const listener = () => setWidth(ref.current?.offsetWidth);

    listener();

    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  });

  return (
    <div ref={ref}>
      <LineChart data={data || []} width={width} color={issuerColor} />
      <Table
        data={tabulate({ rows: data, filterAgency: agency, issuerColor })}
        numberFormatter={formatWithCommas}
      />
    </div>
  );
}

export default DailyDropffsReport;
export { tabulate };
