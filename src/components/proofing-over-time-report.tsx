import { VNode } from "preact";
import Markdown from "preact-markdown";
import { useContext, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import { useQuery } from "preact-fetching";
import { utcWeek, utcDay, CountableTimeInterval } from "d3-time";
import { ascending, mean, rollup } from "d3-array";
import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import useResizeListener from "../hooks/resize-listener";
import Accordion from "./accordion";
import PlotComponent from "./plot";
import {
  FunnelMode,
  ReportFilterContext,
  Scale,
  TimeBucket,
} from "../contexts/report-filter-context";
import {
  DailyDropoffsRow,
  funnelSteps,
  loadData,
  Step,
  StepCount,
  toStepCounts,
} from "../models/daily-dropoffs-report-data";
import {
  formatAsPercent,
  formatSIDropTrailingZeroes,
  formatWithCommas,
  yearMonthDayFormat,
} from "../formats";
import { useAgencies } from "../contexts/agencies-context";
import Table, { TableData } from "./table";
import { kebabCase } from "../strings";

interface StepCountEntry extends StepCount {
  date: Date;
  agency: string;
  issuer: string;
  friendlyName: string;
}

function flatten({
  data,
  funnelMode,
}: {
  funnelMode: FunnelMode;
  data: DailyDropoffsRow[];
}): StepCountEntry[] {
  const results = data.flatMap((row) => {
    const { start, agency: rowAgency, issuer, friendly_name: friendlyName } = row;

    return toStepCounts(row, funnelMode).map((stepCount) => ({
      date: start,
      issuer,
      friendlyName,
      agency: rowAgency,
      ...stepCount,
    }));
  });

  return results;
}

function bucketDates(data: DailyDropoffsRow[], interval: CountableTimeInterval): Date[] {
  return Array.from(new Set(data.map((row) => +interval.floor(row.start))))
    .map((ms) => new Date(ms))
    .sort((a, b) => ascending(a, b));
}

interface VerifiedTotal {
  verified: number;
  total: number;
}

const VERIFIED_TOTAL_ZERO: VerifiedTotal = { verified: 0, total: 0 };

function sumToTotalVerified(bin: DailyDropoffsRow[], funnelMode: FunnelMode): VerifiedTotal {
  const firstStep = funnelSteps(funnelMode)[0].key;

  return bin.reduce(
    ({ total, verified }, d) => ({ total: total + d[firstStep], verified: verified + d.verified }),
    VERIFIED_TOTAL_ZERO
  );
}

function sumOfTotalVerified(values: Map<any, VerifiedTotal>): VerifiedTotal {
  return Array.from(values).reduce(
    ({ total, verified }, [, d]) => ({ total: d.total + total, verified: d.verified + verified }),
    VERIFIED_TOTAL_ZERO
  );
}

function countAndPercent({ total, verified }: VerifiedTotal): [VNode, VNode] {
  const fraction = verified / total || 0;

  return [
    <span data-csv={verified}>{formatWithCommas(verified)}</span>,
    <span data-csv={fraction}>{formatAsPercent(fraction)}</span>,
  ];
}

function tabulateAll({
  data,
  timeBucket,
  funnelMode,
}: {
  data: DailyDropoffsRow[];
  timeBucket: TimeBucket;
  funnelMode: FunnelMode;
}): TableData {
  const interval = timeBucket === TimeBucket.WEEK ? utcWeek : utcDay;
  const dates = bucketDates(data, interval);

  const totalByDate = rollup(
    data,
    (bin) => sumToTotalVerified(bin, funnelMode),
    (d) => +interval.floor(d.start)
  );

  const body = [
    [
      "(All)",
      ...dates.flatMap((date) => countAndPercent(totalByDate.get(+date) || VERIFIED_TOTAL_ZERO)),
      ...countAndPercent(sumOfTotalVerified(totalByDate)),
    ],
  ];

  return {
    header: [
      "Agency",
      ...dates.map((date) => <th colSpan={2}>{yearMonthDayFormat(date)}</th>),
      <th colSpan={2}>Total</th>,
    ],
    body,
  };
}

function tabulateByAgency({
  data,
  timeBucket,
  funnelMode,
  color,
}: {
  data: DailyDropoffsRow[];
  timeBucket: TimeBucket;
  funnelMode: FunnelMode;
  color: (issuer: string) => string;
}): TableData {
  const interval = timeBucket === TimeBucket.WEEK ? utcWeek : utcDay;
  const dates = bucketDates(data, interval);

  const totalByAgencyByDate = rollup(
    data,
    (bin) => sumToTotalVerified(bin, funnelMode),
    (d) => d.agency,
    (d) => +interval.floor(d.start)
  );

  const header = [
    "Agency",
    ...dates.map((date) => <th colSpan={2}>{yearMonthDayFormat(date)}</th>),
    <th colSpan={2}>Total</th>,
  ];

  const body = Array.from(totalByAgencyByDate)
    .sort(([agencyA], [agencyB]) => ascending(agencyA, agencyB))
    .map(([agency, totalByDate]) => [
      <span data-csv={agency}>
        <span style={`color: ${color(agency)}`}>⬤ </span>
        {agency}
      </span>,
      ...dates.flatMap((date) => countAndPercent(totalByDate.get(+date) || VERIFIED_TOTAL_ZERO)),
      ...countAndPercent(sumOfTotalVerified(totalByDate)),
    ]);

  return {
    header,
    body,
  };
}

function tabulateByIssuer({
  data,
  timeBucket,
  funnelMode,
  color,
}: {
  data: DailyDropoffsRow[];
  timeBucket: TimeBucket;
  funnelMode: FunnelMode;
  color: (issuer: string) => string;
}): TableData {
  const interval = timeBucket === TimeBucket.WEEK ? utcWeek : utcDay;
  const dates = bucketDates(data, interval);

  const friendlyNameToIssuer = new Map(data.map((row) => [row.friendly_name, row.issuer]));

  const totalByAgencyByIssuerByDate = rollup(
    data,
    (bin) => sumToTotalVerified(bin, funnelMode),
    (d) => d.agency,
    (d) => d.friendly_name,
    (d) => +interval.floor(d.start)
  );

  const header = [
    "Agency",
    <span data-csv={["Issuer", "Friendly Name"]}>App</span>,
    ...dates.map((date) => <th colSpan={2}>{yearMonthDayFormat(date)}</th>),
    <th colSpan={2}>Total</th>,
  ];

  const body = Array.from(totalByAgencyByIssuerByDate)
    .sort(([agencyA], [agencyB]) => ascending(agencyA, agencyB))
    .flatMap(([agency, issuers]) =>
      Array.from(issuers)
        .sort(([friendlyNameA], [friendlyNameB]) => ascending(friendlyNameA, friendlyNameB))
        .map(([friendlyName, totalByDate]) => {
          const issuer = friendlyNameToIssuer.get(friendlyName);

          return [
            agency,
            <span title={issuer} data-csv={[issuer, friendlyName]}>
              <span style={`color: ${color(friendlyName)}`}>⬤ </span>
              {friendlyName}
            </span>,
            ...dates.flatMap((date) =>
              countAndPercent(totalByDate.get(+date) || VERIFIED_TOTAL_ZERO)
            ),
            ...countAndPercent(sumOfTotalVerified(totalByDate)),
          ];
        })
    );

  return {
    header,
    body,
  };
}

export default function ProofingOverTimeReport(): VNode {
  const ref = useRef(null as HTMLDivElement | null);
  const [width, setWidth] = useState(undefined as number | undefined);
  const {
    start,
    finish,
    agency,
    env,
    funnelMode,
    scale,
    byAgency,
    timeBucket = TimeBucket.WEEK,
  } = useContext(ReportFilterContext);

  const { data } = useQuery(`proofing-over-time-${start.valueOf()}-${finish.valueOf()}`, () =>
    loadData(start, finish, env)
  );

  useResizeListener(() => setWidth(ref.current?.offsetWidth));
  useAgencies(data);

  const lineDeterminer = (() => {
    if (byAgency) {
      if (agency) {
        return "friendlyName";
      }
      return "agency";
    }
  })();
  const color = scaleOrdinal(schemeCategory10);
  const stroke = lineDeterminer ? (d: StepCountEntry) => color(d[lineDeterminer]) : undefined;

  const filter = (d: StepCountEntry) => d.step === Step.VERIFIED;
  const thresholds = timeBucket === TimeBucket.DAY ? utcDay : utcWeek;
  const y = scale === Scale.PERCENT ? "percentOfFirst" : "count";
  const tickFormat = scale === Scale.PERCENT ? formatAsPercent : formatSIDropTrailingZeroes;
  const showAverages = (!byAgency || agency) && scale === Scale.PERCENT;

  const filteredData = (data || []).filter((row) => !agency || row.agency === agency);

  const flatSteps = flatten({ data: filteredData, funnelMode });

  return (
    <div ref={ref}>
      <Accordion title="How is this measured?">
        <Markdown
          markdown={`
**Measurement**: This report shows unique users who started proofing who reached the "verified"
step, meaning they completed proofing. As a percent, the value is the percent of users, starting
at either the "welcome" or "image submit" step (depending on the Funnel Mode setting).

**Timing**: All data is collected, grouped, and displayed in the UTC timezone.

**Known Limitations**:

The data model table can't accurately capture:
- Users who become verified on a different day than the day they start proofing (such as verify by mail)
- Users who attempt proofing at one partner app, and reattempt with a different partner app.`}
        />
      </Accordion>
      <PlotComponent
        plotter={() =>
          Plot.plot({
            y: {
              tickFormat,
              domain: scale === Scale.PERCENT ? [0, 1] : undefined,
              label: "↑ Verified",
            },
            color: {
              legend: true,
            },
            marginRight: 50,
            width,
            marks: [
              Plot.ruleY([0]),
              Plot.lineY(
                flatSteps,
                Plot.binX(
                  { y: scale === Scale.PERCENT ? "mean" : "sum" },
                  {
                    x: "date",
                    y,
                    thresholds,
                    z: lineDeterminer,
                    stroke,
                    title: lineDeterminer,
                    filter,
                  }
                )
              ),
              showAverages &&
                Plot.ruleY(
                  flatSteps,
                  Plot.binY(
                    { y: "mean" },
                    {
                      z: lineDeterminer,
                      stroke,
                      strokeDasharray: "3,2",
                      thresholds,
                      y,
                      filter,
                    }
                  )
                ),
              showAverages &&
                Plot.text(
                  flatSteps,
                  Plot.binY(
                    { y: "mean" },
                    {
                      y,
                      text: (bin: StepCountEntry[]) => tickFormat(mean(bin, (d) => d[y]) || 0),
                      x:
                        timeBucket === TimeBucket.WEEK
                          ? mean([thresholds.floor(finish), thresholds.ceil(finish)])
                          : finish,
                      dx: timeBucket === TimeBucket.DAY ? 15 : undefined,
                      z: lineDeterminer,
                      fill: stroke,
                      thresholds,
                      textAnchor: "start",
                      filter,
                    }
                  )
                ),
            ].filter(Boolean),
          })
        }
        inputs={[
          flatSteps,
          agency,
          start.valueOf(),
          finish.valueOf(),
          width,
          funnelMode,
          scale,
          timeBucket,
        ]}
      />
      {!byAgency && (
        <Table
          data={tabulateAll({
            data: filteredData,
            timeBucket,
            funnelMode,
          })}
          filename={`proofing-over-time-report-${yearMonthDayFormat(start)}-to-${yearMonthDayFormat(
            finish
          )}.csv`}
        />
      )}
      {byAgency && !agency && (
        <Table
          data={tabulateByAgency({ data: filteredData, timeBucket, funnelMode, color })}
          filename={`proofing-over-time-report-agencies-${yearMonthDayFormat(start)}-to-${yearMonthDayFormat(
            finish
          )}.csv`}
        />
      )}
      {byAgency && agency && (
        <Table
          data={tabulateByIssuer({ data: filteredData, timeBucket, funnelMode, color })}
          filename={`proofing-over-time-report-${kebabCase(agency)}-${yearMonthDayFormat(start)}-to-${yearMonthDayFormat(
            finish
          )}.csv`}
        />
      )}
    </div>
  );
}

export { tabulateAll, tabulateByAgency, tabulateByIssuer };
