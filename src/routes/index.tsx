import { VNode } from "preact";
import { Router } from "../router";
import HomeRoute from "./home-route";
import ReportRoute from "./report-route";

export const ROUTES = {
  "/daily-auths-report/": ReportRoute,
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
