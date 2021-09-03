import "./css/style.css";
import '../node_modules/identity-style-guide/dist/assets/scss/_styles.scss';

import { render } from "preact";
import { Link } from "./router";
import { Routes } from "./routes";

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
  document.getElementById('app') as HTMLElement,
);
