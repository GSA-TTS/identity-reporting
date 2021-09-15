import { VNode } from "preact";
import { utcParse } from "d3-time-format";
import { utcWeek } from "d3-time";
import { useState } from "preact/hooks";
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

  const start = (startParam ? yearMonthDayParse(startParam) : null) || startOfPreviousWeek;
  const finish = (finishParam ? yearMonthDayParse(finishParam) : null) || endOfPreviousWeek;
  const ial = (parseInt(ialParam || "", 10) || DEFAULT_IAL) as 1 | 2;
  const env = envParam || DEFAULT_ENV;
  const [allAgencies, setAllAgencies] = useState([] as string[]);

  return (
    <ReportFilterControlsContext.Provider
      value={{ path, start, finish, ial, agency, env, setAllAgencies }}
    >
      <ReportFilterControls agencies={allAgencies} />
      <DailyAuthsReport />
    </ReportFilterControlsContext.Provider>
  );
}

export default ReportRoute;
