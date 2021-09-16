import { VNode } from "preact";
import { utcParse } from "d3-time-format";
import { utcWeek } from "d3-time";
import { AgenciesContextProvider } from "../context/agencies-context";
import ReportFilterControls, {
  ReportFilterControlsContext,
  DEFAULT_IAL,
  DEFAULT_ENV,
} from "../report-filter-controls";
import DailyAuthsReport from "../daily-auths-report";
import Page from "../page";

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

  return (
    <Page path={path} title="Daily Auths Report">
      <AgenciesContextProvider>
        <ReportFilterControlsContext.Provider value={{ start, finish, ial, agency, env }}>
          <ReportFilterControls path={path} />
          <DailyAuthsReport />
        </ReportFilterControlsContext.Provider>
      </AgenciesContextProvider>
    </Page>
  );
}

export default ReportRoute;
