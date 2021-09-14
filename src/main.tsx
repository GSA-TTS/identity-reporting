import "./css/style.scss";

import { render } from "preact";
import { banner, accordion } from "identity-style-guide";
import { Link } from "./router";
import { Routes } from "./routes";

[banner, accordion].forEach((component) => component.on());

render(
  <div>
    <nav>
      <div>
        <Link href="/">Home</Link>
      </div>
      <div>
        <Link href="/daily-auths-report/">Daily Auths Report</Link>
      </div>
    </nav>
    <main>
      <Routes />
    </main>
  </div>,
  document.getElementById("app") as HTMLElement
);
