import { VNode } from "preact";
import { Router } from "../router";
import ReportRoute from "./report";

export const ROUTES = {
  "/daily-auths-report/": ReportRoute,
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
