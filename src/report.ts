import { utcFormat } from "d3-time-format";

const yearFormat = utcFormat("%Y");
const yearMonthDayFormat = utcFormat("%Y-%m-%d");

interface PathParameters {
  reportName: string,
  date: Date,
  env?: string,
}

function path({ reportName, date, env = "prod" }: PathParameters) {
  const year = yearFormat(date);
  const day = yearMonthDayFormat(date);

  // ex: /prod/daily-auths-report/2021/2021-07-27.daily-auths-report.json
  return `/${env}/${reportName}/${year}/${day}.${reportName}.json`;
}

export { path };
