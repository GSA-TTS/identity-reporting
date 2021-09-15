import { createContext, VNode } from "preact";
import { useRef, useContext } from "preact/hooks";
import { utcFormat } from "d3-time-format";
import { utcWeek, CountableTimeInterval } from "d3-time";
import { route } from "./router";
import AgenciesContext from "./agencies-context";

const yearMonthDayFormat = utcFormat("%Y-%m-%d");
const DEFAULT_IAL = 1;
const DEFAULT_ENV = "prod";

interface ReportFilterControlsContextValues {
  start: Date;
  finish: Date;
  ial: 1 | 2;
  agency?: string;
  env: string;
}

const ReportFilterControlsContext = createContext({
  start: new Date(),
  finish: new Date(),
  ial: DEFAULT_IAL,
  env: DEFAULT_ENV,
} as ReportFilterControlsContextValues);

interface ReportFilterControlsProps {
  path: string;
}

function ReportFilterControls({ path }: ReportFilterControlsProps): VNode {
  const { start, finish, agency, ial, env } = useContext(ReportFilterControlsContext);
  const { agencies } = useContext(AgenciesContext);

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
    <>
      <form ref={formRef} onChange={update} className="usa-form">
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
          <button type="button" className="usa-button" onClick={updateTimeRange(utcWeek, -1)}>
            &larr; Previous Week
          </button>
          <button type="button" className="usa-button" onClick={updateTimeRange(utcWeek, +1)}>
            Next Week &rarr;
          </button>
        </div>
        <div>
          <div className="usa-radio">
            <input
              type="radio"
              id="ial-1"
              name="ial"
              value="1"
              checked={ial === 1}
              className="usa-radio__input"
            />
            <label htmlFor="ial-1" className="usa-radio__label">
              IAL 1
            </label>
          </div>
          <div className="usa-radio">
            <input
              type="radio"
              id="ial-2"
              name="ial"
              value="2"
              checked={ial === 2}
              className="usa-radio__input"
            />
            <label htmlFor="ial-2" className="usa-radio__label">
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
                {agencies.map((a) => (
                  <option value={a} selected={a === agency}>
                    {a}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        </div>
        <div>
          <a href="?" className="usa-button usa-button--outline">
            Reset
          </a>
        </div>
        {env !== DEFAULT_ENV && <input type="hidden" name="env" value={env} />}
      </form>
    </>
  );
}

export default ReportFilterControls;
export { ReportFilterControlsContext, DEFAULT_ENV, DEFAULT_IAL };
