import { html } from "htm/preact";
import { Router } from "../router";
import ReportRoute from "./report";

export const ROUTES = {
  "/daily-auths-report": ReportRoute,
};

export function Routes() {
  return html`
    <${Router}>
      ${Object.entries(ROUTES).map(([path, Component]) => html`<${Component} path=${path} />`)}
    <//>
  `;
}
