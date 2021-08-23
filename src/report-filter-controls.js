import { html } from "htm/preact";
import { createContext } from "preact";
import { useState } from "preact/hooks";
import { timeFormat, timeParse } from "d3-time-format";
import { utcWeek } from "d3-time";

const yearMonthDayFormat = timeFormat("%Y-%m-%d");
const yearMonthDayParse = timeParse("%Y-%m-%d");
const DEFAULT_IAL = 1;

const endOfPreviousWeek = utcWeek.floor(new Date());
const startOfPreviousWeek = utcWeek.floor(new Date(endOfPreviousWeek.valueOf() - 1));

/**
 * @typedef ReportFilterControlsContextValues
 * @property {Date} start
 * @property {Date} finish
 * @property {1|2} ial
 * @property {string=} agency
 * @property {string[]} allAgencies
 * @property {(s:string[])=>void} setAllAgencies
 */
const ReportFilterControlsContext = createContext(
  /** @type ReportFilterControlsContextValues */ ({
    start: startOfPreviousWeek,
    finish: endOfPreviousWeek,
    ial: 1,
    allAgencies: [],
    setAllAgencies: () => null,
  })
);

/**
 * @typedef ReportFilterControlsProps
 * @property {import('preact').VNode[]} children
 */

/**
 * @param {ReportFilterControlsProps} props
 * @returns {import('preact').VNode}
 */
function ReportFilterControls({ children }) {
  const [allAgencies, setAllAgencies] = useState([]);

  const searchParams = new URLSearchParams(document.location.search);

  const startParam = searchParams.get("start");
  const finishParam = searchParams.get("finish");
  const ialParam = searchParams.get("ial");

  const start = (startParam ? yearMonthDayParse(startParam) : null) || startOfPreviousWeek;
  const finish = (finishParam ? yearMonthDayParse(finishParam) : null) || endOfPreviousWeek;
  const ial = parseInt(ialParam || "", 10) || DEFAULT_IAL;

  const agency = searchParams.get("agency");

  const filterControls = {
    start,
    finish,
    agency,
    ial,
    setAllAgencies,
  };

  return html`<div>
    <form>
      <div>
        <label>
          Start
          <input type="date" name="start" value=${yearMonthDayFormat(start)} />
        </label>
      </div>
      <div>
        <label>
          Finish
          <input type="date" name="finish" value=${yearMonthDayFormat(finish)} />
        </label>
      </div>
      <div>
        <label><input type="radio" name="ial" value="1" checked=${ial === 1} /> IAL1</label>
        <label><input type="radio" name="ial" value="2" checked=${ial === 2} /> IAL2</label>
      </div>
      <div>
        <label>
          Agency
          <select name="agency">
            <option value="">All</option>
            <optgroup label="Agencies">
              ${allAgencies.map((a) => {
                return html`<option value=${a} selected=${a === agency}>${a}</option>`;
              })}
            </optgroup>
          </select>
        </label>
      </div>
      <div>
        <input type="submit" value="Update" />
        <a href="?"> (Reset) </a>
      </div>
    </form>
    <${ReportFilterControlsContext.Provider} value=${filterControls}> ${children} <//>
  </div>`;
}

export default ReportFilterControls;
export { ReportFilterControlsContext };
