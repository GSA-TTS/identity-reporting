import "./css/style.scss";

import { render } from "preact";
import { banner, accordion } from "identity-style-guide";
import { Link } from "./router";
import { Routes } from "./routes";

[banner, accordion].forEach((component) => component.on());

render(
  <div>
    <header className="usa-header usa-header--extended">
      <div className="usa-navbar">
        <div className="usa-logo">
          <a href="/" title="Home" aria-label="Home">
            <img
              src="/node_modules/identity-style-guide/dist/assets/img/login-gov-logo.svg"
              role="img"
              className="usa-logo__img"
              alt="Login.gov"
            />
            <em className="usa-logo__text">Data</em>
          </a>
        </div>
        <button className="usa-menu-btn">Menu</button>
      </div>
      <nav className="usa-nav">
        <div className="usa-nav__inner">
          <ul className="usa-nav__primary usa-accordion">
            <li className="usa-nav__primary-item">
              <Link href="/">Home</Link>
            </li>
            <li className="usa-nav__primary-item">
              <Link href="/daily-auths-report/">Daily Auths Report</Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
    <main>
      <Routes />
    </main>
  </div>,
  document.getElementById("app") as HTMLElement
);
