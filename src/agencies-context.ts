import { createContext } from "preact";
import { StateUpdater } from "preact/hooks";

interface AgenciesContextValues {
  agencies: string[];
  setAgencies: StateUpdater<string[]>;
}

const AgenciesContext = createContext({
  agencies: [],
  setAgencies: () => null,
} as AgenciesContextValues);

export default AgenciesContext;
