import { VNode } from "preact";
import { useRef, useContext } from "preact/hooks";
import { utcFormat } from "d3-time-format";
import { utcWeek, CountableTimeInterval } from "d3-time";
import { AgenciesContext } from "../contexts/agencies-context";
import { ReportFilterContext, DEFAULT_ENV } from "../contexts/report-filter-context";
import { FunnelMode } from "../models/daily-dropoffs-report-data";

const yearMonthDayFormat = utcFormat("%Y-%m-%d");

interface ReportFilterControlsProps {
  showIal: boolean;
  showFunnelMode: boolean;
}

function ReportFilterControls({
  showIal = false,
  showFunnelMode = false,
}: ReportFilterControlsProps): VNode {
  const { start, finish, agency, ial, env, funnelMode, setParameters } =
    useContext(ReportFilterContext);
  const { agencies } = useContext(AgenciesContext);

  const formRef = useRef(null as HTMLFormElement | null);

  function update(event: Event, overrideFormData: Record<string, string> = {}) {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const formData = new FormData(form);
    Object.entries(overrideFormData).forEach(([key, value]) => formData.set(key, String(value)));
    setParameters(Object.fromEntries(formData) as Record<string, string>);
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
        {showIal && (
          <fieldset className="usa-fieldset">
            <legend className="usa-legend">IAL</legend>
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
          </fieldset>
        )}
        {showFunnelMode && (
          <fieldset className="usa-fieldset">
            <legend className="usa-legend">Funnel Mode</legend>
            <div className="usa-radio">
              <input
                type="radio"
                id="funnel-mode-overall"
                name="funnelMode"
                value={FunnelMode.OVERALL}
                checked={funnelMode === FunnelMode.OVERALL}
                className="usa-radio__input"
              />
              <label htmlFor="funnel-mode-overall" className="usa-radio__label">
                Overall
              </label>
            </div>
            <div className="usa-radio">
              <input
                type="radio"
                id="funnel-mode-blanket"
                name="funnelMode"
                value={FunnelMode.BLANKET}
                checked={funnelMode === FunnelMode.BLANKET}
                className="usa-radio__input"
              />
              <label htmlFor="funnel-mode-blanket" className="usa-radio__label">
                Blanket
              </label>
            </div>
          </fieldset>
        )}
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
export { ReportFilterControlsProps };
