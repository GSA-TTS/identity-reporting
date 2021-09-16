import { VNode } from "preact";
import logoURL from "../node_modules/identity-style-guide/dist/assets/img/login-gov-logo.svg";
import closeURL from "../node_modules/identity-style-guide/dist/assets/img/close.svg";
import { Link } from "./router";

interface HeaderProps {
  path: string;
}

function Header({ path }: HeaderProps): VNode {
  return (
    <header className="usa-header usa-header--extended">
      <div className="usa-navbar">
        <div className="usa-logo">
          <Link href="/" title="Home" aria-label="Home">
            <img src={logoURL} className="usa-logo__img" alt="Login.gov" />
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
            <img src={closeURL} alt="Close" />
          </button>
          <ul className="usa-nav__primary usa-accordion">
            <li className="usa-nav__primary-item">
              <Link href="/" className={path === "/" ? "usa-current" : undefined}>
                Home
              </Link>
            </li>
            <li className="usa-nav__primary-item">
              <Link
                href="/daily-auths-report/"
                className={path === "/daily-auths-report/" ? "usa-current" : undefined}
              >
                Daily Auths Report
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default Header;
