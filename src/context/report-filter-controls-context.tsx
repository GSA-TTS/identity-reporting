import { ComponentChildren, createContext, VNode } from "preact";

interface ReportFilterControlsContextValues {
  start: Date;
  finish: Date;
  ial: 1 | 2;
  agency?: string;
  env: string;
}

export const DEFAULT_CONTEXT: ReportFilterControlsContextValues = {
  start: new Date(),
  finish: new Date(),
  ial: 1,
  env: "prod",
};

const DEFAULT_IAL = 1;
const DEFAULT_ENV = "prod";

const ReportFilterControlsContext = createContext(DEFAULT_CONTEXT);

interface ReportFilterControlsProviderProps {
  start: Date;
  finish: Date;
  ial?: 1 | 2;
  agency?: string;
  env?: string;
  children?: ComponentChildren;
}

export function ReportFilterControlsProvider({
  start,
  finish,
  ial = DEFAULT_IAL,
  agency,
  env = DEFAULT_ENV,
  children,
}: ReportFilterControlsProviderProps): VNode {
  return (
    <ReportFilterControlsContext.Provider value={{ start, finish, ial, env, agency }}>
      {children}
    </ReportFilterControlsContext.Provider>
  );
}

export default ReportFilterControlsContext;
