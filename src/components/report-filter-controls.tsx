import { VNode } from "preact";
import { useRef, useContext } from "preact/hooks";
import { utcFormat } from "d3-time-format";
import { utcWeek, CountableTimeInterval } from "d3-time";
import { AgenciesContext } from "../contexts/agencies-context";
import {
  ReportFilterContext,
  DEFAULT_ENV,
  Scale,
  FunnelMode,
} from "../contexts/report-filter-context";

const yearMonthDayFormat = utcFormat("%Y-%m-%d");

/**
 * Controls on the form that can be opted into
 */
enum Control {
  IAL = "ial",
  FUNNEL_MODE = "funnel_mode",
  SCALE = "scale",
}

interface ReportFilterControlsProps {
  controls?: Control[];
}

function ReportFilterControls({ controls }: ReportFilterControlsProps): VNode {
  const { start, finish, agency, ial, env, funnelMode, scale, setParameters } =
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
      <form ref={formRef} onChange={update} className="usa-form-full-width">
        <div className="grid-container padding-0">
          <div className="grid-row grid-gap">
            <div className="tablet:grid-col-6">
              <fieldset className="usa-fieldset">
                <legend className="usa-legend">Time Range</legend>
                <div className="grid-row grid-gap">
                  <div className="tablet:grid-col-6">
                    <label className="usa-label">
                      Start
                      <input
                        type="date"
                        name="start"
                        value={yearMonthDayFormat(start)}
                        className="usa-input"
                      />
                    </label>
                  </div>
                  <div className="tablet:grid-col-6">
                    <label className="usa-label">
                      Finish
                      <input
                        type="date"
                        name="finish"
                        value={yearMonthDayFormat(finish)}
                        className="usa-input"
                      />
                    </label>
                  </div>
                </div>
                <div className="margin-top-2 grid-row grid-gap">
                  <div className="tablet:grid-col-6">
                    <button
                      type="button"
                      className="usa-button usa-button--full-width margin-bottom-1"
                      onClick={updateTimeRange(utcWeek, -1)}
                    >
                      &larr; Previous Week
                    </button>
                  </div>
                  <div className="tablet:grid-col-6">
                    <button
                      type="button"
                      className="usa-button usa-button--full-width"
                      onClick={updateTimeRange(utcWeek, +1)}
                    >
                      Next Week &rarr;
                    </button>
                  </div>
                </div>
              </fieldset>
              <fieldset className="usa-fieldset">
                <legend className="usa-legend" id="agency-legend">
                  Agency
                </legend>
                <select name="agency" className="usa-select" aria-labelledby="agency-legend">
                  <option value="">All</option>
                  <optgroup label="Agencies">
                    {agencies.map((a) => (
                      <option value={a} selected={a === agency}>
                        {a}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </fieldset>
            </div>
            <div className="tablet:grid-col-6">
              {controls?.includes(Control.IAL) && (
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
                    <label htmlFor="ial-1" className="usa-label usa-radio__label">
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
                    <label htmlFor="ial-2" className="usa-label usa-radio__label">
                      IAL2
                    </label>
                  </div>
                </fieldset>
              )}
              {controls?.includes(Control.FUNNEL_MODE) && (
                <fieldset className="usa-fieldset">
                  <legend className="usa-legend">Funnel Mode</legend>
                  <div className="usa-radio">
                    <input
                      type="radio"
                      id="funnel-mode-blanket"
                      name="funnelMode"
                      value={FunnelMode.BLANKET}
                      checked={funnelMode === FunnelMode.BLANKET}
                      className="usa-radio__input"
                      aria-describedby="funnel-mode-blanket-desc"
                    />
                    <label htmlFor="funnel-mode-blanket" className="usa-label usa-radio__label">
                      Blanket
                    </label>
                    <span className="margin-left-1" id="funnel-mode-blanket-desc">
                      The funnel starts at the welcome step
                    </span>
                  </div>
                  <div className="usa-radio">
                    <input
                      type="radio"
                      id="funnel-mode-actual"
                      name="funnelMode"
                      value={FunnelMode.ACTUAL}
                      checked={funnelMode === FunnelMode.ACTUAL}
                      className="usa-radio__input"
                      aria-describedby="funnel-mode-actual-desc"
                    />
                    <label htmlFor="funnel-mode-actual" className="usa-label usa-radio__label">
                      Actual
                    </label>
                    <span className="margin-left-1" id="funnel-mode-actual-desc">
                      The funnel starts at the image submit step
                    </span>
                  </div>
                </fieldset>
              )}
              {controls?.includes(Control.SCALE) && (
                <fieldset className="usa-fieldset">
                  <legend className="usa-legend">Scale</legend>
                  <div className="usa-radio">
                    <input
                      type="radio"
                      id="scale-count"
                      name="scale"
                      value={Scale.COUNT}
                      checked={scale === Scale.COUNT}
                      className="usa-radio__input"
                    />
                    <label htmlFor="scale-count" className="usa-label usa-radio__label">
                      Count
                    </label>
                  </div>
                  <div className="usa-radio">
                    <input
                      type="radio"
                      id="scale-percent"
                      name="scale"
                      value={Scale.PERCENT}
                      checked={scale === Scale.PERCENT}
                      className="usa-radio__input"
                    />
                    <label htmlFor="scale-percent" className="usa-label usa-radio__label">
                      Percent
                    </label>
                  </div>
                </fieldset>
              )}
            </div>
          </div>
          <div className="grid-row margin-top-2">
            <div className="tablet:grid-col-6">
              <div>
                <a href="?" className="usa-button usa-button--outline">
                  Reset
                </a>
              </div>
            </div>
          </div>
        </div>
        {env !== DEFAULT_ENV && <input type="hidden" name="env" value={env} />}
      </form>
    </>
  );
}

export default ReportFilterControls;
export { ReportFilterControlsProps, Control };
