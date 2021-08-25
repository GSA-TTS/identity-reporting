import { html } from "htm/preact";
import { createContext } from "preact";
import { useState } from "preact/hooks";
import { route } from "preact-router";
import { utcFormat, utcParse } from "d3-time-format";
import { utcWeek } from "d3-time";

const yearMonthDayFormat = utcFormat("%Y-%m-%d");
const yearMonthDayParse = utcParse("%Y-%m-%d");
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
 * @property {string} path
 * @property {string=} start
 * @property {string=} finish
 * @property {string=} ial
 * @property {string=} agency
 */

/**
 * @param {ReportFilterControlsProps} props
 * @returns {import('preact').VNode}
 */
function ReportFilterControls({
  children,
  path,
  start: startParam,
  finish: finishParam,
  ial: ialParam,
  agency: agencyParam,
}) {
  const [allAgencies, setAllAgencies] = useState([]);

  const start = (startParam ? yearMonthDayParse(startParam) : null) || startOfPreviousWeek;
  const finish = (finishParam ? yearMonthDayParse(finishParam) : null) || endOfPreviousWeek;
  const ial = parseInt(ialParam || "", 10) || DEFAULT_IAL;
  const agency = agencyParam?.replace(/\+/g, " ");

  const filterControls = {
    start,
    finish,
    agency,
    ial,
    setAllAgencies,
  };

  /**
   * @param {Event} event
   */
  function update(event) {
    const form = /** @type {HTMLFormElement} */ (event.currentTarget);
    const formData = /** @type {string[][]} */ (Array.from(new FormData(form)));
    route(`${path}?${new URLSearchParams(formData).toString()}`);
    event.preventDefault();
  }

  return html`<div>
    <form onChange=${update}>
      <div>
        <label>
          Start
          <input type="date" name="start" defaultValue=${yearMonthDayFormat(start)} />
        </label>
      </div>
      <div>
        <label>
          Finish
          <input type="date" name="finish" defaultValue=${yearMonthDayFormat(finish)} />
        </label>
      </div>
      <div>
        <label><input type="radio" name="ial" value="1" defaultChecked=${ial === 1} /> IAL1</label>
        <label><input type="radio" name="ial" value="2" defaultChecked=${ial === 2} /> IAL2</label>
      </div>
      <div>
        <label>
          Agency
          <select name="agency">
            <option value="">All</option>
            <optgroup label="Agencies">
              ${allAgencies.map((a) => {
                return html`<option value=${a} defaultSelected=${a === agency}>${a}</option>`;
              })}
            </optgroup>
          </select>
        </label>
      </div>
      <div>
        <a href="?"> (Reset) </a>
      </div>
    </form>
    <${ReportFilterControlsContext.Provider} value=${filterControls}> ${children} <//>
  </div>`;
}

export default ReportFilterControls;
export { ReportFilterControlsContext };
