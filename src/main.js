import "./css/style.css";
import { html } from "htm/preact";
import { render } from "preact";
import { Router, Link } from "./router";
import DailyAuthsReport from "./daily-auths-report";
import ReportFilterControls from "./report-filter-controls";

render(
  html`
    <div>
      <nav>
        <div><${Link} href="/">Home<//></div>
        <div><${Link} href="/daily-auths-report"> Daily Auths Report <//></div>
      </nav>
      <main>
        <${Router}>
          <${ReportFilterControls} path="/daily-auths-report">
            <${DailyAuthsReport} />
          <//>
        <//>
      </main>
    </div>
  `,
  document.body
);
