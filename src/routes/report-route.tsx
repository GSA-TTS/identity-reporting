import { VNode } from "preact";
import DailyAuthsReport from "../daily-auths-report";
import ReportFilterControls from "../report-filter-controls";
import Page from "../page";

export interface ReportRouteProps {
  path: string;
  start?: string;
  finish?: string;
  ial?: string;
  agency?: string;
  env?: string;
}

function ReportRoute(props: ReportRouteProps): VNode {
  const { path } = props;

  return (
    <Page path={path} title="Daily Auths Report">
      <ReportFilterControls {...props}>
        <DailyAuthsReport />
      </ReportFilterControls>
    </Page>
  );
}

export default ReportRoute;
