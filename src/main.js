import "./css/style.css";
import { html } from "htm/preact";
import { render } from "preact";
import { Router, Link } from "./router";
import ReportRoute from "./routes/report";

export const ROUTES = {
  "/daily-auths-report": ReportRoute,
};

render(
  html`
    <div>
      <nav>
        <div><${Link} href="/">Home<//></div>
        <div><${Link} href="/daily-auths-report"> Daily Auths Report <//></div>
      </nav>
      <main>
        <${Router}>
          ${Object.entries(ROUTES).map(([path, Component]) => html`<${Component} path=${path} />`)}
        <//>
      </main>
    </div>
  `,
  document.body
);
