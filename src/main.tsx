import "./css/style.scss";

import { render } from "preact";
import { banner, accordion, navigation } from "identity-style-guide";
import { Link } from "./router";
import { Routes } from "./routes";

[banner, accordion, navigation].forEach((component) => component.on());

render(
  <div>
    <header className="usa-header usa-header--extended">
      <div className="usa-navbar">
        <div className="usa-logo">
          <Link href="/" title="Home" aria-label="Home">
            <img
              src="/node_modules/identity-style-guide/dist/assets/img/login-gov-logo.svg"
              className="usa-logo__img"
              alt="Login.gov"
            />
            <em className="usa-logo__text">Data</em>
          </Link>
        </div>
        <button className="usa-menu-btn" type="button">
          Menu
        </button>
      </div>
      <nav className="usa-nav">
        <div className="usa-nav__inner">
          <button className="usa-nav__close" type="button">
            <img src="/node_modules/identity-style-guide/dist/assets/img/close.svg" alt="Close" />
          </button>
          <ul className="usa-nav__primary usa-accordion">
            <li className="usa-nav__primary-item">
              <Link href="/" activeClassName="usa-current">
                Home
              </Link>
            </li>
            <li className="usa-nav__primary-item">
              <Link href="/daily-auths-report/" activeClassName="usa-current">
                Daily Auths Report
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
    <main>
      <div className="grid-container">
        <div className="grid-row">
          <div className="grid-col-auto">
            <Routes />
          </div>
        </div>
      </div>
    </main>
  </div>,
  document.getElementById("app") as HTMLElement
);
