import { format } from "d3-format";
import { utcFormat, utcParse } from "d3-time-format";

export const yearMonthDayFormat = utcFormat("%Y-%m-%d");

export const formatWithCommas = format(",");

const formatSIPrefix = format(".2s");
export const formatSIDropTrailingZeroes = (d: number): string =>
  formatSIPrefix(d).replace(/\.0+/, "");

export const formatAsPercent = format(".0%");

export const yearMonthDayParse = utcParse("%Y-%m-%d") as (s: string) => Date;
