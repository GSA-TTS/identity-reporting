import { ascending } from "d3-array";
import { path as reportPath } from "./api-path";

interface Result {
  /**
   * ISO8601 date-only string (YYYY-MM-DD)
   */
  date: string;
  total_users: number;
  fully_registered_users: number;
}

interface ProcessedResult {
  date: Date;
  totalUsers: number;
  totalUsersCumulative: number;
  fullyRegisteredUsers: number;
  fullyRegisteredUsersCumulative: number;
}

enum DataType {
  TOTAL_USERS,
  TOTAL_USERS_CUMULATIVE,
  FULLY_REGISTERED_USERS,
  FULLY_REGISTERED_USERS_CUMULATIVE,
}

interface ProcessedRenderableData {
  date: Date;
  value: number;
  type: DataType;
}

interface DailyRegistrationsReportData {
  results: Result[];

  /**
   * ISO8601 string
   */
  finish: string;
}

function process({ results }: DailyRegistrationsReportData): ProcessedResult[] {
  let totalUsersCumulative = 0;
  let fullyRegisteredUsersCumulative = 0;

  return results
    .sort(({ date: dateA }, { date: dateB }) => ascending(dateA, dateB))
    .map(({ date, total_users: totalUsers, fully_registered_users: fullyRegisteredUsers }) => {
      totalUsersCumulative += totalUsers;
      fullyRegisteredUsersCumulative += fullyRegisteredUsers;

      return {
        date: new Date(date),
        totalUsers,
        totalUsersCumulative,
        fullyRegisteredUsers,
        fullyRegisteredUsersCumulative,
      };
    });
}

function toRenderableData(results: ProcessedResult[]): ProcessedRenderableData[] {
  return results.flatMap(
    ({
      date,
      totalUsers,
      totalUsersCumulative,
      fullyRegisteredUsers,
      fullyRegisteredUsersCumulative,
    }) => [
      { date, value: totalUsers, type: DataType.TOTAL_USERS },
      { date, value: totalUsersCumulative, type: DataType.TOTAL_USERS_CUMULATIVE },
      { date, value: fullyRegisteredUsers, type: DataType.FULLY_REGISTERED_USERS },
      {
        date,
        value: fullyRegisteredUsersCumulative,
        type: DataType.FULLY_REGISTERED_USERS_CUMULATIVE,
      },
    ]
  );
}

function loadData(date: Date, env: string, fetch = window.fetch): Promise<ProcessedResult[]> {
  const path = reportPath({ reportName: "daily-registrations-report", date, env });
  return fetch(path)
    .then((response) => (response.status === 200 ? response.json() : { results: [] }))
    .then((report) => process(report));
}

export { ProcessedResult, ProcessedRenderableData, DataType, loadData, toRenderableData };
