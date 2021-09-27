import { VNode } from "preact";
import { Control } from "../components/report-filter-controls";
import DailyAuthsReport from "../components/daily-auths-report";
import DailyDropffsReport from "../components/daily-dropoffs-report";
import { Router } from "../router";
import HomeRoute from "./home-route";
import createReportRoute from "./report-route";

export const ROUTES = {
  "/daily-auths-report/": createReportRoute(DailyAuthsReport, {
    title: "Daily Auths Report",
    controls: [Control.IAL],
  }),
  "/daily-dropoffs-report/": createReportRoute(DailyDropffsReport, {
    title: "Daily Dropoffs Report",
    controls: [Control.FUNNEL_MODE, Control.SCALE],
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
