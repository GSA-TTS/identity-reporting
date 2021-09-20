import { createContext, VNode, ComponentChildren } from "preact";

const DEFAULT_IAL = 1;
const DEFAULT_ENV = "prod";

interface ReportFilterContextValues {
  start: Date;
  finish: Date;
  ial: 1 | 2;
  agency?: string;
  env: string;
}

const ReportFilterContext = createContext({
  start: new Date(),
  finish: new Date(),
  ial: DEFAULT_IAL,
  env: DEFAULT_ENV,
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
export { ReportFilterContext, DEFAULT_IAL, DEFAULT_ENV };
