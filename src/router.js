import { cloneElement, toChildArray } from "preact";
import { html } from "htm/preact";
import { Router as BaseRouter, Link as BaseLink, route as baseRoute } from "preact-router";

const BASE_PATH = import.meta.env.BASE_URL;

/**
 * @param {string} path
 * @returns {string}
 */
function getFullPath(path) {
  return [BASE_PATH, path].filter((p) => p != "/").join("/") || "/";
}

/**
 * @typedef RouterProps
 * @property {import('preact').VNode[]} children
 */

/**
 * @param {RouterProps} props
 * @returns {import('preact').VNode}
 */
export function Router({ children }) {
  return html`
    <${BaseRouter}>
      ${toChildArray(children).map(
        (child) =>
          typeof child === "object" && cloneElement(child, { path: getFullPath(child.props.path) })
      )}
    <//>
  `;
}

/**
 * @typedef LinkProps
 * @property {string} href
 */

/**
 * @param {LinkProps} props
 * @returns {import('preact').VNode}
 */
export function Link({ href, ...otherProps }) {
  return html`<${BaseLink} href=${getFullPath(href)} ...${otherProps} />`;
}

/**
 * @param {string} path
 * @returns {boolean=}
 */
export function route(path) {
  return baseRoute(getFullPath(path));
}
