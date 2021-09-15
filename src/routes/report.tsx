import { VNode } from "preact";
import { utcParse } from "d3-time-format";
import { utcWeek } from "d3-time";
import { useState } from "preact/hooks";
import AgenciesContext from "../agencies-context";
import ReportFilterControls, {
  ReportFilterControlsContext,
  DEFAULT_IAL,
  DEFAULT_ENV,
} from "../report-filter-controls";
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
  env: envParam,
}: ReportRouteProps): VNode {
  const endOfPreviousWeek = utcWeek.floor(new Date());
  const startOfPreviousWeek = utcWeek.floor(new Date(endOfPreviousWeek.valueOf() - 1));

  const start = (startParam && yearMonthDayParse(startParam)) || startOfPreviousWeek;
  const finish = (finishParam && yearMonthDayParse(finishParam)) || endOfPreviousWeek;
  const ial = (parseInt(ialParam || "", 10) || DEFAULT_IAL) as 1 | 2;
  const env = envParam || DEFAULT_ENV;
  const [agencies, setAgencies] = useState([] as string[]);

  return (
    <AgenciesContext.Provider value={{ agencies, setAgencies }}>
      <ReportFilterControlsContext.Provider value={{ path, start, finish, ial, agency, env }}>
        <ReportFilterControls />
        <DailyAuthsReport />
      </ReportFilterControlsContext.Provider>
    </AgenciesContext.Provider>
  );
}

export default ReportRoute;
