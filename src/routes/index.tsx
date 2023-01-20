import { VNode } from "preact";
import { Control } from "../components/report-filter-controls";
import DailyAuthsReport from "../components/daily-auths-report";
import DailyDropffsReport from "../components/daily-dropoffs-report";
import ProofingOverTimeReport from "../components/proofing-over-time-report";
import { Router } from "../router";
import HomeRoute from "./home-route";
import createReportRoute, { ReportRoute } from "./report-route";
import { Scale } from "../contexts/report-filter-context";
import Page from "../components/page";
import Header from "../components/header";

const ROUTES: Record<string, ReportRoute> = {
  "/": { title: "Home", component: HomeRoute },
  "/daily-auths-report/": createReportRoute(DailyAuthsReport, {
    title: "Daily Auths Report",
    controls: [Control.IAL],
  }),
  "/daily-dropoffs-report/": createReportRoute(DailyDropffsReport, {
    title: "Daily Dropoffs Report",
    controls: [Control.FUNNEL_MODE, Control.SCALE],
  }),
  "/proofing-over-time/": createReportRoute(ProofingOverTimeReport, {
    title: "Proofing Over Time Report",
    controls: [Control.FUNNEL_MODE, Control.SCALE, Control.TIME_BUCKET],
    defaultTimeRangeWeekOffset: -3,
    defaultScale: Scale.PERCENT,
  }),
};

export function Routes(): VNode {
  return (
    <Router>
      {Object.entries(ROUTES).map(([path, { title, component: Component }]) => (
        <>
          <Header path={path} routes={ROUTES} />
          <Page title={title}>
            <Component />
          </Page>
        </>
      ))}
    </Router>
  );
}
