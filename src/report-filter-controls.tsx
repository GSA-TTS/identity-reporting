import { createContext, h, VNode } from "preact";
import { StateUpdater, useState } from "preact/hooks";
import { utcFormat, utcParse } from "d3-time-format";
import { utcWeek } from "d3-time";
import { route } from "./router";

const yearMonthDayFormat = utcFormat("%Y-%m-%d");
const yearMonthDayParse = utcParse("%Y-%m-%d");
const DEFAULT_IAL = 1;

const endOfPreviousWeek = utcWeek.floor(new Date());
const startOfPreviousWeek = utcWeek.floor(new Date(endOfPreviousWeek.valueOf() - 1));

interface ReportFilterControlsContextValues {
  start: Date;
  finish: Date;
  ial: 1 | 2;
  agency?: string;
  setAllAgencies: StateUpdater<string[]>;
}

const ReportFilterControlsContext = createContext({
  start: startOfPreviousWeek,
  finish: endOfPreviousWeek,
  ial: 1,
  setAllAgencies: () => null,
} as ReportFilterControlsContextValues);

interface ReportFilterControlsProps {
  children: VNode[];
  path: string;
  start?: string;
  finish?: string;
  ial?: string;
  agency?: string;
}

function ReportFilterControls({
  children,
  path,
  start: startParam,
  finish: finishParam,
  ial: ialParam,
  agency,
}: ReportFilterControlsProps): VNode {
  const [allAgencies, setAllAgencies] = useState([] as string[]);

  const start = (startParam ? yearMonthDayParse(startParam) : null) || startOfPreviousWeek;
  const finish = (finishParam ? yearMonthDayParse(finishParam) : null) || endOfPreviousWeek;
  const ial = (parseInt(ialParam || "", 10) || DEFAULT_IAL) as 1 | 2;

  const filterControls = {
    start,
    finish,
    agency,
    ial,
    setAllAgencies,
  };

  function update(event: Event) {
    const form = event.currentTarget as HTMLFormElement;
    const formData = Array.from(new FormData(form)) as string[][];
    route(`${path}?${new URLSearchParams(formData).toString().replace(/\+/g, "%20")}`);
    event.preventDefault();
  }

  return (
    <div>
      <form onChange={update}>
        <div>
          <label>
            Start
            <input type="date" name="start" value={yearMonthDayFormat(start)} />
          </label>
        </div>
        <div>
          <label>
            Finish
            <input type="date" name="finish" value={yearMonthDayFormat(finish)} />
          </label>
        </div>
        <div>
          <label>
            <input type="radio" name="ial" value="1" checked={ial === 1} /> IAL1
          </label>
          <label>
            <input type="radio" name="ial" value="2" checked={ial === 2} /> IAL2
          </label>
        </div>
        <div>
          <label>
            Agency
            <select name="agency">
              <option value="">All</option>
              <optgroup label="Agencies">
                $
                {allAgencies.map((a) => {
                  return (
                    <option value={a} default={a === agency}>
                      {a}
                    </option>
                  );
                })}
              </optgroup>
            </select>
          </label>
        </div>
        <div>
          <a href="?">(Reset)</a>
        </div>
      </form>
      <ReportFilterControlsContext.Provider value={filterControls}>
        {children}
      </ReportFilterControlsContext.Provider>
    </div>
  );
}

export default ReportFilterControls;
export { ReportFilterControlsContext };
