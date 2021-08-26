import "./css/style.css";
import { html } from "htm/preact";
import { render } from "preact";
import { Link } from "./router";
import { Routes } from "./routes";

render(
  html`
    <div>
      <nav>
        <div><${Link} href="/">Home<//></div>
        <div><${Link} href="/daily-auths-report/"> Daily Auths Report <//></div>
      </nav>
      <main>
        <${Routes} />
      </main>
    </div>
  `,
  document.body
);
