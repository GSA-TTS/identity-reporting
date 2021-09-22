import { VNode } from "preact";
import DailyAuthsReport from "../daily-auths-report";
import DailyDropffsReport from "../daily-dropoffs-report";
import { Router } from "../router";
import HomeRoute from "./home-route";
import ReportRoute from "./report-route";

export const ROUTES = {
  "/daily-auths-report/": ReportRoute(DailyAuthsReport),
  "/daily-dropoffs-report/": ReportRoute(DailyDropffsReport),
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
