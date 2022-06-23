import { VNode } from "preact";
import Markdown from "preact-markdown";
import { useContext, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import { useQuery } from "preact-fetching";
import { utcWeek, utcDay } from "d3-time";
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
  loadData,
  Step,
  StepCount,
  toStepCounts,
} from "../models/daily-dropoffs-report-data";
import { formatAsPercent, formatSIDropTrailingZeroes } from "../formats";
import { useAgencies } from "../contexts/agencies-context";

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

    return toStepCounts(row, funnelMode).map((stepCount) => {
      return {
        date: start,
        issuer,
        friendlyName,
        agency: rowAgency,
        ...stepCount,
      };
    });
  });

  return results;
}

export default function ProofingOverTimeReport(): VNode {
  const ref = useRef(null as HTMLDivElement | null);
  const [width, setWidth] = useState(undefined as number | undefined);
  const { start, finish, agency, env, funnelMode, scale, byAgency, timeBucket } =
    useContext(ReportFilterContext);

  const { data } = useQuery(`${start.valueOf()}-${finish.valueOf()}`, () =>
    loadData(start, finish, env)
  );

  useResizeListener(() => setWidth(ref.current?.offsetWidth));
  useAgencies(data);

  const flatSteps = flatten({ data: data || [], funnelMode });

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
        plotter={() =>
          Plot.plot({
            y: {
              tickFormat: scale === Scale.PERCENT ? formatAsPercent : formatSIDropTrailingZeroes,
              domain: scale === Scale.PERCENT ? [0, 1] : undefined,
            },
            color: {
              legend: true,
            },
            width,
            marks: [
              Plot.ruleY([0]),
              Plot.lineY(
                flatSteps,
                Plot.binX(
                  { y: scale === Scale.PERCENT ? "mean" : "sum" },
                  {
                    x: "date",
                    y: scale === Scale.PERCENT ? "percentOfFirst" : "count",
                    thresholds: timeBucket === TimeBucket.DAY ? utcDay : utcWeek,
                    z: byAgency ? "agency" : undefined,
                    stroke: byAgency ? "agency" : undefined,
                    title: byAgency ? "agency" : undefined,
                    filter: (d: StepCountEntry) =>
                      d.step === Step.VERIFIED && (!agency || d.agency === agency),
                  }
                )
              ),
            ],
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
    </div>
  );
}
