import { html } from "htm/preact";
import DailyAuthsReport from "../daily-auths-report";
import ReportFilterControls from "../report-filter-controls";

/**
 *
 * @param {*} props
 * @returns {import('preact').VNode}
 */
function ReportRoute(props) {
  return html`<${ReportFilterControls} ...${props}><${DailyAuthsReport} /><//>`;
}

export default ReportRoute;
