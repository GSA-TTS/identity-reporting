import { VNode } from "preact";
import Markdown from "preact-markdown";
import { useContext, useRef, useState } from "preact/hooks";
import * as Plot from "@observablehq/plot";
import { useQuery } from "preact-fetching";
import { utcWeek, utcDay } from "d3-time";
import { mean } from "d3-array";
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
import { loadReleases } from "../github";

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

export default function ProofingOverTimeReport(): VNode {
  const ref = useRef(null as HTMLDivElement | null);
  const [width, setWidth] = useState(undefined as number | undefined);
  const { start, finish, agency, env, funnelMode, scale, byAgency, timeBucket } =
    useContext(ReportFilterContext);

  const { data } = useQuery(`${start.valueOf()}-${finish.valueOf()}`, () =>
    loadData(start, finish, env)
  );

  const { data: releases } = useQuery("identity-idp-releases", () =>
    loadReleases({ owner: "18f", repo: "identity-idp" })
  );

  const filteredReleases = (releases || []).filter(
    ({ createdAt }) => start <= createdAt && createdAt <= finish
  );

  useResizeListener(() => setWidth(ref.current?.offsetWidth));
  useAgencies(data);

  const flatSteps = flatten({ data: data || [], funnelMode });

  const lineDeterminer = (() => {
    if (byAgency) {
      if (agency) {
        return "friendlyName";
      }
      return "agency";
    }
  })();

  const filter = (d: StepCountEntry) =>
    d.step === Step.VERIFIED && (!agency || d.agency === agency);
  const thresholds = timeBucket === TimeBucket.DAY ? utcDay : utcWeek;
  const y = scale === Scale.PERCENT ? "percentOfFirst" : "count";
  const tickFormat = scale === Scale.PERCENT ? formatAsPercent : formatSIDropTrailingZeroes;

  const showAverages = (!byAgency || agency) && scale === Scale.PERCENT;

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
              Plot.ruleX(filteredReleases, { x: "createdAt", title: "name" }),
              Plot.text(filteredReleases, { x: "createdAt", y: 1, text: "name" }),
              Plot.lineY(
                flatSteps,
                Plot.binX(
                  { y: scale === Scale.PERCENT ? "mean" : "sum" },
                  {
                    x: "date",
                    y,
                    thresholds,
                    z: lineDeterminer,
                    stroke: lineDeterminer,
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
                      stroke: lineDeterminer,
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
                      fill: lineDeterminer,
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
          filteredReleases,
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
