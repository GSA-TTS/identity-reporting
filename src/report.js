import { utcFormat, utcParse } from 'd3-time-format';

const yearFormat = utcFormat('%Y');
const yearMonthDayFormat = utcFormat('%Y-%m-%d');

/**
 * @typedef PathProps
 * @prop {string} reportName
 * @prop {Date} date
 * @prop {string=} env 
 */

/**
 * @param {PathProps} props
 */
function path({ reportName, date, env = 'prod' }) {
  const year = yearFormat(date);
  const day = yearMonthDayFormat(date);

  // ex: /prod/daily-auths-report/2021/2021-07-27.daily-auths-report.json
  return `/${env}/${reportName}/${year}/${day}.${reportName}.json`
}

export { path };
