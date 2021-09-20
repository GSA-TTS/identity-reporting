import { createContext, VNode, ComponentChildren } from "preact";
import { route } from "../router";

const DEFAULT_IAL = 1;
const DEFAULT_ENV = "prod";

interface ReportFilterContextValues {
  start: Date;
  finish: Date;
  ial: 1 | 2;
  agency?: string;
  env: string;
  setParameters: (params: Record<string, string>) => void;
}

/**
 * preact-router does not parse "+" as spaces the way JS encodes them
 */
function pathWithParams(path: string, searchParams: URLSearchParams): string {
  return `${path}?${searchParams.toString().replace(/\+/g, "%20")}`;
}

function defaultSetParameters(
  params: Record<string, string>,
  location: Location = window.location
): void {
  const searchParams = new URLSearchParams(location.search);
  Object.keys(params).forEach((key) => searchParams.set(key, params[key]));
  route(pathWithParams(location.pathname, searchParams));
}

const ReportFilterContext = createContext({
  start: new Date(),
  finish: new Date(),
  ial: DEFAULT_IAL,
  env: DEFAULT_ENV,
  setParameters: defaultSetParameters,
} as ReportFilterContextValues);

function ReportFilterContextProvider({
  children,
  ...rest
}: { children: ComponentChildren } & ReportFilterContextValues): VNode {
  return (
    <ReportFilterContext.Provider value={{ ...rest }}>{children}</ReportFilterContext.Provider>
  );
}

export default ReportFilterContextProvider;
export { ReportFilterContext, DEFAULT_IAL, DEFAULT_ENV, defaultSetParameters };
