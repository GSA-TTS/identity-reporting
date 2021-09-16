import { createContext, VNode, ComponentChildren } from "preact";
import { StateUpdater, useState } from "preact/hooks";

interface AgenciesContextValues {
  agencies: string[];
  setAgencies: StateUpdater<string[]>;
}

const AgenciesContext = createContext({
  agencies: [],
  setAgencies: () => null,
} as AgenciesContextValues);

function AgenciesContextProvider({ children }: { children: ComponentChildren }): VNode {
  const [agencies, setAgencies] = useState([] as string[]);
  return (
    <AgenciesContext.Provider value={{ agencies, setAgencies }}>
      {children}
    </AgenciesContext.Provider>
  );
}

export { AgenciesContextProvider, AgenciesContext };
