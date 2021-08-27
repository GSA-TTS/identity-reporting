import { VNode } from "preact";
import DailyAuthsReport from "../daily-auths-report";
import ReportFilterControls from "../report-filter-controls";

// TODO: don't use "any" ... ReportFilterControlsProps results in an type error in index.tsx
function ReportRoute(props: any): VNode {
  return (
    <ReportFilterControls {...props}>
      <DailyAuthsReport />
    </ReportFilterControls>
  );
}

export default ReportRoute;
