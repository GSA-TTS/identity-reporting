import { createContext, VNode, ComponentChildren } from "preact";
import { StateUpdater, useState } from "preact/hooks";
import { utcFormat, utcParse } from "d3-time-format";
import { utcWeek, CountableTimeInterval } from "d3-time";
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

export interface ReportFilterControlsProps {
  children: ComponentChildren;
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

  function update(event: Event, overrideFormData = {}) {
    const form =
      (event.target instanceof HTMLButtonElement && event.target.form) ||
      (event.currentTarget as HTMLFormElement);
    const formData = Array.from(new FormData(form)) as string[][];
    const seachParams = new URLSearchParams(formData);
    Object.entries(overrideFormData).forEach(([key, value]) => seachParams.set(key, String(value)));
    route(`${path}?${seachParams.toString().replace(/\+/g, "%20")}`);
    event.preventDefault();
  }

  function updateTimeRange(interval: CountableTimeInterval, offset: number) {
    return function (event: Event) {
      return update(event, {
        start: yearMonthDayFormat(interval.offset(start, offset)),
        finish: yearMonthDayFormat(interval.offset(finish, offset)),
      });
    };
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
          <button onClick={updateTimeRange(utcWeek, -1)}>&larr; Previous Week</button>
          <button onClick={updateTimeRange(utcWeek, +1)}>Next Week &rarr;</button>
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
                {allAgencies.map((a) => {
                  return (
                    <option value={a} selected={a === agency}>
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
