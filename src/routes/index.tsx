import { VNode } from "preact";
import DailyAuthsReport from "../components/daily-auths-report";
import DailyDropffsReport from "../components/daily-dropoffs-report";
import { Router } from "../router";
import HomeRoute from "./home-route";
import createReportRoute from "./report-route";

export const ROUTES = {
  "/daily-auths-report/": createReportRoute(DailyAuthsReport, {
    title: "Daily Auths Report",
    filterOpts: { showIal: true, showFunnelMode: false },
  }),
  "/daily-dropoffs-report/": createReportRoute(DailyDropffsReport, {
    title: "Daily Dropoffs Report",
    filterOpts: { showIal: false, showFunnelMode: true },
  }),
  "/": HomeRoute,
};

export function Routes(): VNode {
  return (
    <Router>
      {Object.entries(ROUTES).map(([path, Component]) => (
        <Component path={path} />
      ))}
    </Router>
  );
}
