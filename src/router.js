import { cloneElement, toChildArray } from "preact";
import { html } from "htm/preact";
import { Router as BaseRouter, Link as BaseLink, route as baseRoute } from "preact-router";

/** @typedef {import('preact-router').RoutableProps} RoutableProps */
/** @typedef {import('preact').VNode<P>} VNode @template P */

const BASE_PATH = /** @type {Record<string,any>} */ (import.meta).env?.BASE_URL;

/**
 * @param {string=} path
 * @returns {string}
 */
export function getFullPath(path = "", basePath = BASE_PATH) {
  if (path.startsWith(basePath)) {
    return path;
  } else {
    return (
      "/" +
      [basePath, path]
        .map((p) => p.replace(/^\/|\/$/g, ""))
        .filter(Boolean)
        .join("/")
    );
  }
}

/**
 * @typedef RouterProps
 * @property {import('preact').ComponentChildren} children
 */

/**
 * @param {RouterProps} props
 * @returns {import('preact').VNode}
 */
export function Router({ children }) {
  const childrenAsArray = /** @type {VNode<RoutableProps>[]} */ (toChildArray(children));

  return html`
    <${BaseRouter}>
      ${childrenAsArray.map(
        (child) =>
          typeof child === "object" && cloneElement(child, { path: getFullPath(child.props.path) })
      )}
    <//>
  `;
}

/**
 * @param {preact.JSX.HTMLAttributes} props
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
