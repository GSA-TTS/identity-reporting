import { VNode } from "preact";
import DailyAuthsReport from "../daily-auths-report";
import { Router } from "../router";
import HomeRoute from "./home-route";
import ReportRoute from "./report-route";

export const ROUTES = {
  "/daily-auths-report/": ReportRoute(DailyAuthsReport),
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
