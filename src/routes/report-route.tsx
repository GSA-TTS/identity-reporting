import { VNode } from "preact";
import { utcParse } from "d3-time-format";
import { utcWeek } from "d3-time";
import { AgenciesContextProvider } from "../contexts/agencies-context";
import ReportFilterContextProvider, {
  DEFAULT_IAL,
  DEFAULT_ENV,
} from "../contexts/report-filter-context";
import ReportFilterControls, {
  ReportFilterControlsProps,
} from "../components/report-filter-controls";
import Page from "../components/page";
import { DEFAULT_FUNNEL_MODE, FunnelMode } from "../models/daily-dropoffs-report-data";

const yearMonthDayParse = utcParse("%Y-%m-%d");

export interface ReportRouteProps {
  path: string;
  start?: string;
  finish?: string;
  ial?: string;
  agency?: string;
  env?: string;
  funnelMode?: FunnelMode;
}

function createReportRoute(
  Report: () => VNode,
  {
    title,
    filterOpts,
  }: {
    title: string;
    filterOpts: ReportFilterControlsProps;
  }
): (props: ReportRouteProps) => VNode {
  return ({
    path,
    start: startParam,
    finish: finishParam,
    ial: ialParam,
    agency,
    env: envParam,
    funnelMode: funnelModeParam,
  }: ReportRouteProps): VNode => {
    const endOfPreviousWeek = utcWeek.floor(new Date());
    const startOfPreviousWeek = utcWeek.floor(new Date(endOfPreviousWeek.valueOf() - 1));

    const start = (startParam && yearMonthDayParse(startParam)) || startOfPreviousWeek;
    const finish = (finishParam && yearMonthDayParse(finishParam)) || endOfPreviousWeek;
    const ial = (parseInt(ialParam || "", 10) || DEFAULT_IAL) as 1 | 2;
    const env = envParam || DEFAULT_ENV;
    const funnelMode = funnelModeParam || DEFAULT_FUNNEL_MODE;

    return (
      <Page path={path} title={title}>
        <AgenciesContextProvider>
          <ReportFilterContextProvider
            start={start}
            finish={finish}
            ial={ial}
            agency={agency}
            env={env}
            funnelMode={funnelMode}
          >
            <ReportFilterControls {...filterOpts} />
            <Report />
          </ReportFilterContextProvider>
        </AgenciesContextProvider>
      </Page>
    );
  };
}

export default createReportRoute;
