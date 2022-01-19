import { VNode } from "preact";
import { utcParse } from "d3-time-format";
import { utcWeek, utcDay } from "d3-time";
import { AgenciesContextProvider } from "../contexts/agencies-context";
import ReportFilterContextProvider, {
  DEFAULT_IAL,
  DEFAULT_ENV,
  Scale,
  DEFAULT_SCALE,
  DEFAULT_FUNNEL_MODE,
  FunnelMode,
} from "../contexts/report-filter-context";
import ReportFilterControls, { Control } from "../components/report-filter-controls";
import Page from "../components/page";

const yearMonthDayParse = utcParse("%Y-%m-%d");

export interface ReportRouteProps {
  path: string;
  start?: string;
  finish?: string;
  ial?: string;
  agency?: string;
  env?: string;
  funnelMode?: FunnelMode;
  scale?: Scale;
}

function createReportRoute(
  Report: () => VNode,
  {
    title,
    controls,
  }: {
    title: string;
    controls?: Control[];
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
    scale: scaleParam,
  }: ReportRouteProps): VNode => {
    const endOfPreviousWeek = utcDay.offset(utcWeek.floor(new Date()), -1);
    const startOfPreviousWeek = utcWeek.floor(new Date(endOfPreviousWeek.valueOf() - 1));

    const start = (startParam && yearMonthDayParse(startParam)) || startOfPreviousWeek;
    const finish = (finishParam && yearMonthDayParse(finishParam)) || endOfPreviousWeek;
    const ial = (parseInt(ialParam || "", 10) || DEFAULT_IAL) as 1 | 2;
    const env = envParam || DEFAULT_ENV;
    const funnelMode = funnelModeParam || DEFAULT_FUNNEL_MODE;
    const scale = scaleParam || DEFAULT_SCALE;

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
            scale={scale}
          >
            <ReportFilterControls controls={controls} />
            <Report />
          </ReportFilterContextProvider>
        </AgenciesContextProvider>
      </Page>
    );
  };
}

export default createReportRoute;
