import { createContext, VNode, ComponentChildren } from "preact";
import { StateUpdater, useRef, useState } from "preact/hooks";
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

  const formRef = useRef(null as HTMLFormElement | null);

  function update(event: Event, overrideFormData = {}) {
    const form = formRef.current;
    if (!form) {
      return;
    }
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
    <div className="usa-form">
      <form ref={formRef} onChange={update}>
        <div>
          <label>
            Start
            <input
              type="date"
              name="start"
              value={yearMonthDayFormat(start)}
              className="usa-input"
            />
          </label>
        </div>
        <div>
          <label>
            Finish
            <input
              type="date"
              name="finish"
              value={yearMonthDayFormat(finish)}
              className="usa-input"
            />
          </label>
        </div>
        <div>
          <button onClick={updateTimeRange(utcWeek, -1)} className="usa-button">
            &larr; Previous Week
          </button>
          <button onClick={updateTimeRange(utcWeek, +1)} className="usa-button">
            Next Week &rarr;
          </button>
        </div>
        <div>
          <div class="usa-radio">
            <input
              type="radio"
              id="ial-1"
              name="ial"
              value="1"
              checked={ial === 1}
              className="usa-radio__input"
            />
            <label for="ial-1" className="usa-radio__label">
              IAL 1
            </label>
          </div>
          <div class="usa-radio">
            <input
              type="radio"
              id="ial-2"
              name="ial"
              value="2"
              checked={ial === 2}
              className="usa-radio__input"
            />
            <label for="ial-2" className="usa-radio__label">
              IAL2
            </label>
          </div>
        </div>
        <div>
          <label>
            Agency
            <select name="agency" className="usa-select">
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
          <a href="?" className="usa-button usa-button--outline">
            Reset
          </a>
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
