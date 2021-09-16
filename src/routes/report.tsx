import { VNode } from "preact";
import { utcParse } from "d3-time-format";
import { utcWeek } from "d3-time";
import { useState } from "preact/hooks";
import { ReportFilterControlsProvider } from "../context/report-filter-controls-context";
import AgenciesContext from "../agencies-context";
import ReportFilterControls from "../report-filter-controls";
import DailyAuthsReport from "../daily-auths-report";

const yearMonthDayParse = utcParse("%Y-%m-%d");

export interface ReportRouteProps {
  path: string;
  start?: string;
  finish?: string;
  ial?: string;
  agency?: string;
  env?: string;
}

function ReportRoute({
  path,
  start: startParam,
  finish: finishParam,
  ial: ialParam,
  agency,
  env,
}: ReportRouteProps): VNode {
  const endOfPreviousWeek = utcWeek.floor(new Date());
  const startOfPreviousWeek = utcWeek.floor(new Date(endOfPreviousWeek.valueOf() - 1));

  const start = (startParam && yearMonthDayParse(startParam)) || startOfPreviousWeek;
  const finish = (finishParam && yearMonthDayParse(finishParam)) || endOfPreviousWeek;
  const ial = (parseInt(ialParam || "", 10) || undefined) as 1 | 2 | undefined;
  const [agencies, setAgencies] = useState([] as string[]);

  return (
    <AgenciesContext.Provider value={{ agencies, setAgencies }}>
      <ReportFilterControlsProvider
        start={start}
        finish={finish}
        ial={ial}
        agency={agency}
        env={env}
      >
        <ReportFilterControls path={path} />
        <DailyAuthsReport />
      </ReportFilterControlsProvider>
    </AgenciesContext.Provider>
  );
}

export default ReportRoute;
