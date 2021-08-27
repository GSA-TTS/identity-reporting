import { VNode } from "preact";
import DailyAuthsReport from "../daily-auths-report";
import ReportFilterControls from "../report-filter-controls";

export interface ReportRouteProps {
  path: string;
  start?: string;
  finish?: string;
  ial?: string;
  agency?: string;
}

function ReportRoute(props: ReportRouteProps): VNode {
  return (
    <ReportFilterControls {...props}>
      <DailyAuthsReport />
    </ReportFilterControls>
  );
}

export default ReportRoute;
