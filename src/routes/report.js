import { html } from "htm/preact";
import DailyAuthsReport from "../daily-auths-report";
import ReportFilterControls from "../report-filter-controls";

function ReportRoute() {
  return html`
    <>
    <${ReportFilterControls} path="/daily-auths-report">
      <${DailyAuthsReport} />
    <//>
  `;
}

export default ReportRoute;
