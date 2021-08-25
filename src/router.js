import { cloneElement, toChildArray } from "preact";
import { html } from "htm/preact";
import { Router as BaseRouter, Link as BaseLink, route as baseRoute } from "preact-router";

const BASE_PATH = ((base) => (base != "/" ? base : undefined))(import.meta.env.BASE_URL);

function getFullPath(path) {
  return [BASE_PATH, path].filter(Boolean).join("/");
}

export function Router({ children }) {
  return html`
    <${BaseRouter}>
      ${toChildArray(children).map((child) =>
        cloneElement(child, { path: getFullPath(child.props.path) })
      )}
    <//>
  `;
}

export function Link({ href, ...otherProps }) {
  return html`<${BaseLink} href=${getFullPath(href)} ...${otherProps} />`;
}

export function route(path) {
  return baseRoute(getFullPath(path));
}