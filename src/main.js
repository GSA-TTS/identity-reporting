import "./css/style.css";
import { html } from "htm/preact";
import { render } from "preact";
import { Link, Route } from "wouter-preact";
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
        <${Route} path="/daily-auths-report">
          <${ReportFilterControls}>
            <${DailyAuthsReport} />
          <//>
        <//>
      </main>
    </div>
  `,
  document.body
);
